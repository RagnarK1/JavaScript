'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Conversation } from '@/models/conversation';
import { User } from '@/models/user';
import {
  isAuthed,
  pullAllUsers,
  pullConversationRelations,
  pullConversations,
  pullFollowData,
  pullGroupDetails,
  pullGroupMembers,
  pullMessages,
  pullProfile,
  pushConversation,
} from '@/app/actions';
import { generateRandomSixDigitNumber } from '@/clientUtils';
import { Message } from '@/models/message';
import { getSession } from '@/session';
import { usePathname } from 'next/navigation';
import { useWebSocket } from '@/context/wsContext';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useChatContext } from '@/context/chatContext';
import { motion } from 'framer-motion';
import { useSessionContext } from '@/context/sessionContext';

//Handles everything related to the chat. Supports emojis.
//TODO: Profile images to conversations
export default function ChatV2() {
  const pathname = usePathname();
  const chatContext = useChatContext();
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [lastEmoji, setLastEmoji] = useState('');
  const { message, sendMessage, updateChat } = useWebSocket();
  const conversationRef = useRef<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Map<number, Message[]>>(
    new Map<number, Message[]>()
  );
  const [openedConversations, setOpenedConversations] = useState<
    Conversation[]
  >([]);
  const [generatedConversationItems, setGeneratedConversationItems] = useState<
    JSX.Element[]
  >([]);
  const [generatedGroupConversationItems, setGeneratedGroupConversationItems] =
    useState<JSX.Element[]>([]);
  const sessionContext = useSessionContext();
  async function sendNewMessage(message: Message) {
    const found = messages.get(message.conversationId);
    if (found && sessionContext?.session) {
      const updatedMessages = new Map(messages);
      found.push(message);
      message.firstname = sessionContext.session.firstname;
      message.lastname = sessionContext.session.lastname;
      //we need to only send user ids in receivers
      updatedMessages.set(message.conversationId, found);
      setMessages(updatedMessages);
      sendMessage({ type: 'new_message', data: message });
    }
  }
  async function createConversation(targetId: number) {
    //first find if conversation with these participants already exists
    const found = conversationRef.current.find((convo) =>
      convo.participants.includes(targetId)
    );
    if (found) {
      //check if this conversation is included in the activeConversations
      if (!openedConversations.find((conv) => conv.id === found.id)) {
        openConversation(found);
      }
      return;
    }
    const result: Conversation | undefined = await pushConversation(targetId);
    if (result) {
      result.uniqueId = generateRandomSixDigitNumber();
      conversationRef.current.push(result);
      setOpenedConversations([...openedConversations, result]);
      generateConversations().then();
      messages.set(result.id, []);
    }
  }
  const openConversation = useCallback(
    (conversation: Conversation) => {
      //first check if open convos already include it
      if (!openedConversations.find((conv) => conv.id === conversation.id)) {
        setOpenedConversations([...openedConversations, conversation]);
      }
    },
    [openedConversations]
  );
  useEffect(() => {
    if (!message) {
      return;
    }
    if (message.type === 'new_message') {
      setMessages((prevMessages) => {
        const tempMessages = new Map(prevMessages);

        // Find the conversation in the new map
        const foundConversation = tempMessages.get(message.data.conversationId);

        // Update or create the conversation
        if (foundConversation) {
          // This creates a new array reference, so React knows the state has changed
          tempMessages.set(message.data.conversationId, [
            ...foundConversation,
            message.data,
          ]);
        } else {
          tempMessages.set(message.data.conversationId, [message.data]);
        }

        // Return the new state
        return tempMessages;
      });
    }
  }, [message]);
  const generateConversations = useCallback(async () => {
    if (!sessionContext?.session?.id) return;
    const directItems = [];
    const groupItems = [];
    for (let conversation of conversationRef.current) {
      const participantsPromise = conversation.participants?.map(async (r) =>
        pullProfile(r)
      );
      if (!participantsPromise) {
        return;
      }
      let participants = (await Promise.all(participantsPromise)) || [];
      if (conversation.type === 'direct') {
        participants = participants.filter(
          (p) => p?.id !== sessionContext?.session?.id
        ); //filter out current user
        const newItem = (
          <div
            key={conversation.uniqueId}
            onClick={() => openConversation(conversation)}
            className='avatar flex flex-row items-center'
          >
            <div className='w-12 rounded-full'>
              <img
                src={
                  participants.find((p) => participants[0]?.id === p?.id)
                    ?.avatarPath || '/placeholder.png'
                }
              />
            </div>
            <p className='ml-2 font-bold hover:cursor-pointer'>
              {participants.map((p) => `${p?.firstname} ${p?.lastname}`)}
            </p>
          </div>
        );
        directItems.push(newItem);
      } else {
        //get the group members. they are the participants here
        //conversation relation includes the group id. members will be pulled from the group
        const convRelations = await pullConversationRelations(conversation.id);
        if (convRelations) {
          const group = await pullGroupDetails(convRelations[0].groupId || 0);
          const nitem = (
            <div className='avatar-group -space-x-6 rtl:space-x-reverse'>
              {participants.map((p) => {
                if (!p) {
                  return null;
                }
                return (
                  <div key={p.id} className='avatar'>
                    <div className='w-12 rounded-full'>
                      <img
                        src={p.avatarPath ? p.avatarPath : '/placeholder.png'}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
          const newItem = (
            <div
              key={conversation.uniqueId}
              onClick={() => openConversation(conversation)}
              className='flex flex-row items-center'
            >
              {nitem}
              <p className='ml-2 font-bold hover:cursor-pointer'>{`${group?.name}`}</p>
            </div>
          );
          groupItems.push(newItem);
        }
      }
    }
    setGeneratedGroupConversationItems(groupItems);
    setGeneratedConversationItems(directItems);
  }, [openConversation, sessionContext?.session?.id]);
  const generateOpenedConversations = () => {
    const items = [];
    for (let opened of openedConversations) {
      const onClose = () => {
        setOpenedConversations(
          openedConversations.filter(
            (item) => item.uniqueId !== opened.uniqueId
          )
        );
      };
      items.push(
        <ConversationElement
          toggleEmoji={() => setEmojiOpen((prev) => !prev)}
          emojiSelected={lastEmoji}
          key={opened.uniqueId}
          sendMessage={sendNewMessage}
          messages={messages}
          onClose={onClose}
        >
          {opened}
        </ConversationElement>
      );
    }
    return items;
  };
  const generateUsers = () => {
    const items = [];
    for (let user of allUsers || []) {
      items.push(
        <div
          key={user.id}
          onClick={() => createConversation(user.id)}
          className='avatar flex flex-row items-center'
        >
          <div className='w-12 rounded-full'>
            <img src={user.avatarPath || '/placeholder.png'} />
          </div>
          <p className='ml-2 font-bold hover:cursor-pointer'>{`${user.firstname} ${user.lastname}`}</p>
        </div>
      );
    }
    return items;
  };
  function filterUniqueByProperty(arr: any, property: any) {
    const uniqueSet = new Set();
    return arr.filter((obj: any) => {
      if (!uniqueSet.has(obj[property])) {
        uniqueSet.add(obj[property]);
        return true;
      }
      return false;
    });
  }
  useEffect(() => {
    async function getResult() {
      conversationRef.current = await pullConversations();
      for (let conv of conversationRef.current) {
        if (messages.get(conv.id)) {
          continue;
        }
        const pulledMessages = await pullMessages(conv.id);
        messages.set(conv.id, pulledMessages || []);
      }
      if (sessionContext && sessionContext.session) {
        let followers = await pullFollowData(
          'followers',
          sessionContext?.session?.id
        );
        const followings = await pullFollowData(
          'followings',
          sessionContext?.session?.id
        );
        if (followings && followers) {
          //followers.push(...followings);
          //remove yourself
          //get all the users
          const users = new Set<User>();
          for (let u of followers) {
            let r = await pullProfile(u.FollowerId);
            if (r) {
              users.add(r);
            }
            r = await pullProfile(u.FollowingId);
            if (r) {
              users.add(r);
            }
          }
          const au = [];
          for (const user of users) {
            if (user.id === sessionContext.session.id) {
              continue;
            }
            // Your iteration logic here
            au.push(user);
          }
          setAllUsers(au);
        }
      }
      generateConversations().then();
    }
    getResult().then();
  }, [generateConversations, messages, pathname, sessionContext, updateChat]);
  if (!sessionContext?.session?.id) {
    return null;
  }
  const variants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '100%', opacity: 0 },
  };
  return (
    <React.Fragment>
      <motion.div
        initial='closed'
        animate={chatContext?.show ? 'open' : 'closed'}
        variants={variants}
        transition={{ duration: 0.5 }}
        id='chat-sidebar'
        className={` fixed bottom-0 right-0 z-10 flex h-[90vh] w-[20vw]  flex-col bg-blue-500 pl-3`}
      >
        {generatedConversationItems.length === 0 &&
          generatedGroupConversationItems.length === 0 &&
          allUsers.length === 0 ? (
          <p>Nobody to chat with! Start by following people.</p>
        ) : null}
        {generatedConversationItems.length > 0 ? (
          <>
            <motion.p className='text-lg font-bold'>Conversations</motion.p>
            <motion.div>{generatedConversationItems}</motion.div>
          </>
        ) : null}
        {generatedGroupConversationItems.length > 0 ? (
          <>
            <motion.p className='text-lg font-bold'>
              Group Conversations
            </motion.p>
            <motion.div>{generatedGroupConversationItems}</motion.div>
          </>
        ) : null}
        {allUsers.length > 0 ? (
          <>
            <motion.p className='text-lg font-bold'>Users</motion.p>
            <motion.div>{generateUsers()}</motion.div>
          </>
        ) : null}
      </motion.div>
      <div className='fixed bottom-0 right-0 z-50 flex flex-row-reverse'>
        {generateOpenedConversations()}
      </div>
    </React.Fragment>
  );
}

type ConversationProps = {
  children: Conversation;
  targetUserId?: number;
  onClose: () => void;
  messages: Map<number, Message[]>;
  sendMessage: (message: Message) => void;
  toggleEmoji: () => void;
  emojiSelected: string;
};
function ConversationElement(props: ConversationProps) {
  const [emojiOpen, setEmojiOpen] = useState(false); //layout for empji selecion
  const [chatTitle, setChatTitle] = useState('');
  const [users, setUsers] = useState<User[]>();
  const [owner, setOwner] = useState<User>(); //maybe replace this with global context
  const [text, setText] = useState('');
  const [generatedMessages, setGeneratedMessages] = useState<JSX.Element[]>([]);
  const scrollableElementRef = useRef<HTMLDivElement>(null);
  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter') {
      // Call your function here
      sendMessage();
      setText('');
    }
  };
  function sendMessage() {
    if (text.length === 0) {
      return;
    }
    const message: Message = {
      authorId: owner!.id,
      conversationId: props.children.id,
      content: text,
      timestamp: Math.floor(Date.now() / 1000),
      receivers: users?.map((user) => user.id),
    };
    props.sendMessage(message);
  }



  useEffect(() => {
    const handleKeyDown = (event: { key: string; }) => {
      if (event.key === 'Escape') {
        setEmojiOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    setText((prev) => prev + props.emojiSelected);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };

  }, [props.emojiSelected]);

  useEffect(() => {
    const items = [];
    if (owner) {
      for (let message of props.messages.get(props.children.id) || []) {
        items.push(
          <MessageElement
            key={generateRandomSixDigitNumber()}
            owner={owner!}
            message={message}
          />
        );
      }
      setGeneratedMessages(items);
    }
  }, [owner, props.children.id, props.messages]);
  useEffect(() => {
    if (scrollableElementRef.current) {
      scrollableElementRef.current.scrollTop =
        scrollableElementRef.current.scrollHeight;
    }
  }, [generatedMessages]);
  useEffect(() => {
    async function getResult() {
      const ownerResult: User | undefined = await isAuthed();
      setOwner(ownerResult);
      let tempUsers: User[] = [];
      if (props.children.type === 'direct') {
        if (props.children.participants.length > 0) {
          for (let participant of props.children.participants || []) {
            if (participant === ownerResult!.id) {
              continue;
            }
            let profile = await pullProfile(participant);
            if (profile) {
              tempUsers.push(profile);
            }
          }
          const t = tempUsers?.map(
            (user) => `${user.firstname} ${user.lastname}`
          );
          setChatTitle(t?.join(' ') || '');
        }
      } else {
        //get the members of this conversation, which is the members of the group
        //get the relationships of this group, next.js should use the cached data which was fetched above in another component
        const relations = await pullConversationRelations(props.children.id);
        if (relations) {
          const members: User[] | undefined = await pullGroupMembers(
            relations[0].groupId || 0
          );
          const group = await pullGroupDetails(relations[0].groupId || 0);
          setChatTitle(group?.name || '');
          if (members) {
            tempUsers = tempUsers.concat(...members);
            //set participants as well to the conversation element, otherwise it doesnt know where to send the messages
          }
        }
      }
      setUsers(tempUsers);
    }
    getResult().then();
  }, [
    props.children.id,
    props.children.participants,
    props.targetUserId,
    props.children.type,
  ]);
  return (
    <div className='flex h-[60vh] w-[22vw] flex-col rounded-t-xl bg-gray-800'>
      {emojiOpen ? (
        <div className='fixed bottom-12 z-10'>
          <Picker
            className='h-[20vh] w-[20vw]'
            data={data}
            perLine={8}
            emojiButtonSize={30}
            onEmojiSelect={(a: any) => setText((prev) => prev + a.native)}
          />
        </div>
      ) : null}
      <div className='flex flex-row justify-between pl-3 pr-3'>
        <p className='text-white'>{chatTitle}</p>
        <button className='btn btn-xs' onClick={props.onClose}>
          Close
        </button>
      </div>
      <div
        ref={scrollableElementRef}
        className='flex min-h-[80%] flex-col gap-2 overflow-auto pb-5 pt-5'
      >
        {generatedMessages}
      </div>
      <div className='relative flex flex-row-reverse items-center gap-1 pl-1 pr-1'>
        <button
          onClick={() => setEmojiOpen((prev) => !prev)}
          className='btn btn-sm absolute left-0 ml-1'
        >
          🙂
        </button>
        <input
          type='text'
          className='input w-full'
          value={text}
          placeholder='Your message...'
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button
          className='btn btn-sm absolute mr-2'
          onClick={() => {
            sendMessage();
            setText('');
          }}
        >
          Send
        </button>
        <button>Emojii</button>
      </div>
    </div>
  );
}

type MessageElementProps = {
  owner: User;
  message: Message;
};

function MessageElement(props: MessageElementProps) {
  const [expanded, setExpanded] = useState(false);
  const isOwner = props.owner.id === props.message.authorId;
  return (
    <div className={`chat relative ${isOwner ? 'chat-end' : 'chat-start'}`}>
      <div
        onClick={() => setExpanded((prev) => !prev)}
        className='chat-bubble'
        style={{
          height: 'auto',
          overflowWrap: 'break-word',
          minHeight: 'auto',
          maxHeight: 'auto',
          overflowY: isOwner ? 'hidden' : 'auto',
          overflowX: isOwner ? 'hidden' : 'visible',
          wordWrap: 'break-word',
        }}
      >
        {props.message.content}
      </div>
      {expanded ? (
        <div
          className={`absolute ${isOwner ? 'right-5 ' : 'left-5 '
            } -bottom-2 z-10 text-xs text-black`}
        >
          {props.message?.firstname}
        </div>
      ) : null}
    </div>
  );
}
