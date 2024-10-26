'use server';
import { cookies } from 'next/headers';
import { authedFetch } from '@/utils';
import { Conversation } from '@/models/conversation';
import { generateRandomSixDigitNumber } from '@/clientUtils';
import { User } from '@/models/user';
import { revalidatePath } from 'next/cache';
import { removeSession, setSession } from '@/session';
import { Group } from '@/models/group';
import { Notification } from '@/models/notification';
import { ConversationRelationship } from '@/models/conversationRelationship';
import { Post } from '@/models/post';
import { Comment } from '@/models/comment';
import { redirect } from 'next/navigation';
import { Relationship } from '@/models/relationship';

/*
These serve as Next.js server actions. Can be used by client components as well, but mostly for server components using formAction
*/
function isDateInputMoreThan3YearsAgo(dateInput: string): boolean {
  // Parse the date input string into a Date object
  const inputDate = new Date(dateInput);

  // Get the current date
  const currentDate = new Date();

  // Calculate the date 3 years ago
  const threeYearsAgo = new Date(currentDate);
  threeYearsAgo.setFullYear(currentDate.getFullYear() - 3);

  // Compare the input date with the date 3 years ago
  return inputDate < threeYearsAgo;
}

function isValidEmail(email: string): boolean {
  // Regular expression pattern for validating email addresses
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

  // Use the test method of the regular expression to check if the email is valid
  return emailPattern.test(email);
}
//Send register form to the backend server
export const register = async (formData: FormData) => {
  const dateString = formData.get('dob') as string;
  const day = parseInt(dateString.split('-')[2]);
  const year = parseInt(dateString.split('-')[0]);
  const month = parseInt(dateString.split('-')[1]);
  if (!isDateInputMoreThan3YearsAgo(dateString)) {
    redirect('/authentication/register?error=tooYoung');
  }
  try {
    const userObject = {
      nickname: formData.get('nickname'),
      email: formData.get('email'),
      password: formData.get('password'),
      firstname: formData.get('firstname'),
      lastname: formData.get('lastname'),
      dob: {
        day: day,
        month: month,
        year: year,
      },
      aboutMe: formData.get('aboutMe'),
      avatarPath: formData.get('my_image'),
      isPrivate: formData.get('isPrivate'),
    };

    //Validate form, and redirect with error params when something not right
    if (
      userObject.email?.length === 0 ||
      userObject.password?.length === 0 ||
      userObject.firstname?.length === 0 ||
      userObject.lastname?.length === 0
    ) {
      redirect('/authentication/register?error=invalid');
    }
    if (
      Number.isNaN(userObject.dob.day) ||
      Number.isNaN(userObject.dob.month) ||
      Number.isNaN(userObject.dob.year)
    ) {
      redirect('/authentication/register?error=date');
    }
    if ((formData.get('my_image') as File).size === 0) {
      formData.delete('my_image');
    }
    if (!isValidEmail(userObject.email as string)) {
      redirect('/authentication/register?error=email');
    }
    const result = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_HOST + '/register',
      {
        method: 'POST',
        body: formData,
      }
    );
    if (!result.ok) {
      redirect('/authentication/register?error=exists');
    }
    const resultCookies = result.headers.getSetCookie();
    cookies().set(
      'session',
      resultCookies[0].split(';')[0].replace('session=', ''),
      {
        secure: true,
      }
    );
    const authedUser = await isAuthed();
    if (!authedUser) {
      redirect('/authentication/register?error=server');
    }
    await setSession(authedUser);
  } catch (err) {
    throw err;
  }
  redirect('/');
};
//send login form to the backend. need to add error handling
export const login = async (form: FormData) => {
  const obj = {
    username: form.get('email'),
    password: form.get('password'),
  };
  try {
    const result = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_HOST + '/login',
      {
        body: JSON.stringify(obj),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        cache: 'no-store',
      }
    );
    if (!result.ok) {
      redirect('/authentication/login?error=invalid');
    }
    const resultCookies = result.headers.getSetCookie();
    cookies().set(
      'session',
      resultCookies[0].split(';')[0].replace('session=', ''),
      {
        secure: true,
      }
    );
    const authedUser = await isAuthed();
    if (authedUser) {
      await setSession(authedUser);
    } else {
      return;
    }
  } catch (e) {
    throw e;
  }
  redirect('/');
};
export const pullPost = async (id: number) => {
  try {
    const result = await authedFetch(
      process.env.NEXT_PUBLIC_BACKEND_HOST + '/post?id=' + id
    );
    if (result.ok) {
      let json = await result.json();
      return {
        success: true,
        post: json.body as Post,
      };
    }
    return {
      success: false,
      message: result.statusText,
    };
  } catch (e: any) {
    console.log(e.message);
    return {
      success: false,
    };
  }
};
//Send post to the backend server
export const pushPost = async (form: FormData) => {
  const image = form.get('my_image') as File;
  if (image) {
    if (image.size === 0) {
      //no image was supplied, remove it from the form
      form.delete('my_image');
      console.log('removing');
    }
  }
  try {
    const result = await authedFetch(
      process.env.NEXT_PUBLIC_BACKEND_HOST + '/post',
      'POST',
      form
    );
    let json = await result.json();
    redirect(`/post/view/${json.body}`);
  } catch (e: any) {
    if (e.message === 'NEXT_REDIRECT') {
      throw e;
    }
    console.log(e.message);
  }

  /*
  const groupId = parseInt(form.get("group") as string)
  const obj = {
    title: form.get('title'),
    content: form.get('content'),
    privacy: parseInt(form.get('privacy') as string),
    groupId: Number.isNaN(groupId) ? 0 : groupId,
    imagePath: form.get("image_path"),
    image: form.get("my_image")
  };
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/post',
    'POST',
    JSON.stringify(obj)
  );
  console.log(result.statusText)
  if (!result.ok) {
    return {
      success: false,
      message: result.statusText
    }
  }
  let json = await result.json()
  //redirect to the newly created post
  redirect(`/post/view/${json.body}`)*/
};
export async function logout() {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/logout'
  );
  if (result.ok) {
    await removeSession();
    redirect('/authentication/login');
  }
}

//Current solution, maybe there is a better way
export async function isAuthed() {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/authedProfile'
  );
  if (result.ok) {
    const json = await result.json();
    return json.body as User;
  }
}

export const pushGroup = async (form: FormData) => {
  const obj = {
    name: form.get('name'),
    description: form.get('description'),
  };
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/group',
    'POST',
    JSON.stringify(obj)
  );
  if (result.ok) {
    //show success message
    let json = await result.json();
    revalidatePath('/groups/all');
    return {
      success: true,
      groupId: json.body,
    };
  } else {
    return {
      success: false,
      message: result.statusText,
    };
  }
};

export const pullProfile = async (userId: number) => {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/profile?id=' + userId
  );
  if (result.ok) {
    let json = await result.json();
    return json.body as User;
  } else {
    console.log(result.statusText);
  }
};

//get the list of all users
export const pullAllUsers = async () => {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/allUsers'
  );
  if (result.ok) {
    let json = await result.json();
    return json.body as User[];
  }
};

export const pullConversations = async () => {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/allConversations',
    'GET',
    undefined,
    'no-cache'
  );
  if (result.ok) {
    let json = await result.json();
    const conversations: Conversation[] = json.body || [];
    return conversations.map((convo) => {
      const newConv: Conversation = {
        ...convo,
        uniqueId: generateRandomSixDigitNumber(),
      };
      return newConv;
    });
  }
  return [];
};

export const pullConversationRelations = async (conversationId: number) => {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST +
      '/getConversationRelationship?id=' +
      conversationId
  );
  if (result.ok) {
    let json = await result.json();
    return json.body as ConversationRelationship[];
  }
};

export const pushConversation = async (targetUserId: number) => {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/conversations',
    'POST',
    JSON.stringify({
      recipients: [targetUserId],
    })
  );
  if (result.ok) {
    let json = await result.json();
    return json.body as Conversation;
  }
};

export const pullMessages = async (conversationId: number) => {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/messages?id=' + conversationId
  );
  if (result.ok) {
    let json = await result.json();
    return json.body;
  }
};

export const authenticateWebsocket = async () => {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/ws-auth'
  );
  if (result.ok) {
    return await result.json();
  }
};

export const searchUser = async (
  searchTerm: string
): Promise<User[] | undefined> => {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/searchUser?search=' + searchTerm
  );
  if (result.ok) {
    let json = await result.json();
    return json.body;
  }
};
export const inviteGroupMember = async (
  groupId: number,
  userId: number,
  request?: boolean
) => {
  let body: any = { userId: userId, groupId: groupId };
  if (request) {
    body['isRequest'] = true;
  }
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/groupInvite',
    'POST',
    JSON.stringify(body)
  );
  return {
    status: result.ok,
    message:
      result.status == 409
        ? 'Invite already sent!'
        : result.status === 200
        ? 'Invite sent'
        : 'Failed to send invite',
  };
};

function isDateTodayOrInFuture(date: Date): boolean {
  // Get the current date
  const currentDate = new Date();

  // Remove the time component from the current date to compare only the dates
  currentDate.setHours(0, 0, 0, 0);

  // Remove the time component from the input date to compare only the dates
  date.setHours(0, 0, 0, 0);

  // Compare the input date with the current date
  return date >= currentDate;
}
export const pushEvent = async (formData: FormData) => {
  const date = formData.get('date') as string;
  let dateObject = new Date(date);
  const groupId = parseInt(<string>formData.get('groupId'));
  if (!isDateTodayOrInFuture(dateObject)) {
    redirect('/groups/' + groupId + '/?eventError=Date cannot be in the past');
  }
  if (!date) {
    redirect('/groups/' + groupId + '/?eventError=Date not specified');
  }
  if (formData.get('title')?.length === 0) {
    redirect('/groups/' + groupId + '/?eventError=Title too short');
  }
  if (formData.get('description')?.length === 0) {
    redirect('/groups/' + groupId + '/?eventError=Description too short');
  }
  let timestamp = dateObject.getTime();
  let unixTimestampInSeconds = Math.floor(timestamp / 1000);
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/event',
    'POST',
    JSON.stringify({
      title: formData.get('title'),
      description: formData.get('description'),
      groupId: groupId,
      timestamp: unixTimestampInSeconds,
    })
  );
  if (result.ok) {
    revalidatePath('/groups/' + formData.get('groupId'));
  } else {
    const message =
      result.status == 409
        ? 'Event with this title already exists'
        : result.status === 200
        ? 'Event created'
        : 'Failed to create event';

    redirect('/groups/' + groupId + '/eventError=' + message);
  }
};

//accept the group invite
export async function acceptInvite(form: FormData) {
  const groupId = parseInt(form.get('groupId') as string);
  const userId = parseInt((form.get('userId') as string) || '');
  return await sendInviteAction(
    groupId,
    'accept',
    Number.isNaN(userId) ? 0 : userId
  );
}

export async function denyInvite(form: FormData) {
  const groupId = parseInt(form.get('groupId') as string);
  const userId = parseInt((form.get('userId') as string) || '');
  return await sendInviteAction(
    groupId,
    'deny',
    Number.isNaN(userId) ? 0 : userId
  );
}

async function sendInviteAction(
  groupId: number,
  actionType: 'deny' | 'accept',
  userId: number = 0
) {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST +
      `/groupInvite?groupId=${groupId}&action=${actionType}${
        userId !== 0 ? '&userId=' + userId : ''
      }`
  );
  if (result.ok) {
    revalidatePath('/groups/' + groupId);
    return {
      success: true,
    };
  }
  return {
    success: false,
    message: result.statusText,
  };
}

export async function acceptEvent(formData: FormData) {
  const eventId = parseInt(formData.get('eventId') as string);
  const status = parseInt(formData.get('status') as string);
  const obj = {
    eventId: eventId,
    acceptStatus: status,
  };
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/eventInvite',
    'POST',
    JSON.stringify(obj)
  );
  console.log(result.statusText);
  if (result.ok) {
    revalidatePath('/groups/');
  }
}
//Get the groups you are in
export async function pullParticipatingGroups() {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/getGroupRelations'
  );
  if (result.ok) {
    let json = await result.json();
    return json.body;
  }
}

export async function deleteNotification(id: number) {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/notifications?id=' + id.toString(),
    'DELETE'
  );
  if (result.ok) {
    return {
      success: true,
    };
  }
  return {
    success: false,
    message: result.statusText,
  };
}

export async function pullNotifications() {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/notifications'
  );
  if (result.ok) {
    let json = await result.json();
    return json.body as Notification[];
  }
}

export async function pushNotification() {
  const body = JSON.stringify({});
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/notifications',
    'POST'
  );
  if (result.ok) {
    return {
      success: true,
    };
  } else {
    return {
      success: false,
      message: result.statusText,
    };
  }
}
export async function pullGroupMembers(groupId: number) {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/groupMembers?groupId=' + groupId
  );
  if (result.ok) {
    let json = await result.json();
    return json.body as User[];
  }
}
export async function pullGroupDetails(
  groupId: number
): Promise<Group | undefined> {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/group?groupId=' + groupId
  );
  if (result.ok) {
    const json = await result.json();
    return json.body;
  }
}

export async function pullPostsByGroupId(groupId: number) {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST +
      '/getPostsByGroupId?groupId=' +
      groupId.toString()
  );
  const json = await result.json();
  return json.body as Post[];
}
export async function pullPostsByUserId(form: FormData) {
  const userId = parseInt((form.get('userId') as string) || '');
  const result = await authedFetch(process.env.NEXT_PUBLIC_BACKEND_HOST + '');
}

export async function setProfilePrivacy(form: FormData) {
  const isPrivate = form.get('newStatus')?.toString();
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST +
      '/setProfilePrivacy?status=' +
      isPrivate
  );
  if (result.ok) {
    revalidatePath('/profile');
  }
}

export async function pushComment(form: FormData) {
  if (form.get('comment')?.length === 0) {
    redirect(
      `/post/view/${
        form.get('postId') as string
      }?error=Comment content is too short`
    );
  }
  const image = form.get('my_image') as File;
  if (image) {
    if (image.size === 0) {
      //no image was supplied, remove it from the form
      form.delete('my_image');
      console.log('removing');
    }
  }
  try {
    const result = await authedFetch(
      process.env.NEXT_PUBLIC_BACKEND_HOST + '/comments',
      'POST',
      form
    );
    if (result.ok) {
      revalidatePath(`/post/view/${form.get('postId') as string}`);
    } else {
      const json = await result.json();
    }
  } catch (e) {
    redirect(
      `/post/view/${
        form.get('postId') as string
      }?error=Failed to create comment`
    );
  }
  /*const obj = {
    postId: parseInt(form.get("postId") as string) || 0,
    content: form.get("comment"),
    timestamp: Math.floor(new Date().getTime() / 1000),
    privacy: 0,
    imagePath: form.get("image")
  }
  if (obj.content?.length === 0) {
    redirect(`/post/view/${obj.postId}?error=Content too short`)
  }
  const result = await authedFetch(process.env.NEXT_PUBLIC_BACKEND_HOST + "/comments", "POST", JSON.stringify(obj))
  if (result.ok) {
    redirect(`/post/view/${obj.postId}`)
  }
  redirect(`/post/view/${obj.postId}?error=Failed to create comment`)*/
}

export async function pullComments(postId: number) {
  try {
    const result = await authedFetch(
      process.env.NEXT_PUBLIC_BACKEND_HOST + '/comments?id=' + postId
    );
    if (result.ok) {
      let json = await result.json();
      return {
        success: true,
        comments: json.body as Comment[],
      };
    }
    return {
      success: false,
    };
  } catch (e: any) {
    console.log('PullComments: ', e.message);
    return {
      success: false,
    };
  }
}

export async function followUser(form: FormData) {
  const userId = parseInt(form.get('userId') as string);
  try {
    const result = await authedFetch(
      process.env.NEXT_PUBLIC_BACKEND_HOST + '/relationship',
      'POST',
      JSON.stringify({
        targetId: userId,
      })
    );
    if (result.ok) {
      revalidatePath('/profile/' + userId);
      return {
        success: true,
      };
    }
  } catch (e: any) {
    return {
      success: false,
    };
  }
}

//Accept follow request
export async function acceptFollow(formData: FormData) {
  try {
    const targetId = parseInt(formData.get('targetId') as string);
    const userId = parseInt(formData.get('userId') as string);
    const result = await authedFetch(
      process.env.NEXT_PUBLIC_BACKEND_HOST + '/relationshipRequest',
      'POST',
      JSON.stringify({
        targetId: targetId,
        accept: true,
      })
    );
    if (result.ok) {
      revalidatePath('/profile/' + userId);
    } else {
    }
  } catch (e: any) {}
}
export async function denyFollow(formData: FormData) {
  try {
    const targetId = parseInt(formData.get('targetId') as string);
    const userId = parseInt(formData.get('userId') as string);
    const result = await authedFetch(
      process.env.NEXT_PUBLIC_BACKEND_HOST + '/relationshipRequest',
      'POST',
      JSON.stringify({
        targetId: targetId,
        accept: false,
      })
    );
    if (result.ok) {
      revalidatePath('/profile/' + userId);
    } else {
      console.log('deny follow: ', result.statusText);
    }
  } catch (e: any) {
    console.log('deny follow: ', e.message);
  }
}

export async function pullFollowRequests() {
  try {
    const result = await authedFetch(
      process.env.NEXT_PUBLIC_BACKEND_HOST + '/relationshipRequest'
    );
    if (result.ok) {
      let json = await result.json();
      return json.body as Relationship[];
    }
  } catch (e: any) {
    console.log('pullfollowrequests: ', e.message);
  }
}

export async function pullFollowData(
  action: 'followers' | 'followings',
  targetId: number
) {
  try {
    const result = await authedFetch(
      process.env.NEXT_PUBLIC_BACKEND_HOST +
        `/relationship?action=${action}&targetId=${targetId}`
    );
    if (result.ok) {
      let json = await result.json();
      return (json.body as Relationship[]) || [];
    }
  } catch (e: any) {
    console.log(e.message);
  }
}
