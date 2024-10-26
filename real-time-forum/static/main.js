const loginContainer = document.getElementById('loginContainer');
const loginForm = document.getElementById('loginForm');
const registerContainer = document.getElementById('registerContainer');
const forumContent = document.getElementById('forumContent');
const loginLink = document.getElementById('loginLink');
const registerLink = document.getElementById('registerLink');
const logoutButton = document.getElementById('logoutButton');
const chatUsers = document.getElementById('chatUsers');
const userInfo = document.getElementById('userInfo');
const loggedInNicknameElement = document.getElementById('loggedInNickname');
const registerButton = document.getElementById('registerButton');
const createPostButton = document.getElementById('createPostButton');
const createCommentButton = document.getElementById('createCommentButton');
const postsFeed = document.getElementById('postsFeed');
const postView = document.getElementById('postView');
const backToPostsFeedBtn = document.getElementById('backToPostsFeedBtn');
const chatContainer = document.getElementById('chatContainer');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatButton = document.getElementById('sendChatButton');
const closeChatButton = document.querySelector('.closeChat');
const messageNotification = document.getElementById('messageNotification');

let loggedInUser = null;

let messageWebsocket = null; 

document.addEventListener('DOMContentLoaded', async function () {
    await toggleAuthenticationView();

    if (getAuthToken()) {
        createUserWebSocketConnection(loggedInUser);
        await fetchAndDisplayPosts();
    }

    postsList.addEventListener('click', (e) => {
        console.log("postsList click event triggered");
        const divElement = e.target.closest('[data-id]');

        if (divElement) {
            const postId = divElement.getAttribute('data-id');
            forumContent.style.display = 'none';
            postsFeed.style.display = 'none';
            postView.style.display = 'block';
            displaySelectedPost(postId);
        }
    });

    createMessengerWebSocketConnection();
});

function createUserWebSocketConnection(loggedInUser) {
    const socket = new WebSocket(`ws://localhost:8080/api/getUsers?userId=${loggedInUser}`);

    socket.addEventListener('open', async (event) => {
        console.log('WebSocket connection opened:', event);
        await fetchAndDisplayPosts();
    });

    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
    
        chatUsers.innerHTML = ''; 
        data
            .filter((user) => user.id != loggedInUser.id)
            .sort((a, b) => a.nickname.localeCompare(b.nickname))
            .forEach((user) => {
                let userElement = document.createElement('p');
                userElement.setAttribute('receiver-id', user.id);
                if (user.isOnline) {
                    userElement.textContent += user.nickname;
                    userElement.classList.add('online');
                } else {
                    userElement.textContent += user.nickname;
                    userElement.classList.add('offline');
                }
                chatUsers.appendChild(userElement);
            });
    });  
}

function updateChatUserList() {
    const users = Array.from(chatUsers.children);
    users.sort((a, b) => {
      const lastInteractionA = parseInt(a.getAttribute('data-last-interaction')) || 0;
      const lastInteractionB = parseInt(b.getAttribute('data-last-interaction')) || 0;
      return lastInteractionB - lastInteractionA;
    });
  
    chatUsers.innerHTML = '';
    users.forEach(user => {
      chatUsers.appendChild(user);
    });
}
  
function updateLastInteraction(userId, timestamp) {
    const userElement = document.querySelector(`[receiver-id="${userId}"]`);
    if (userElement) {
        userElement.setAttribute('data-last-interaction', timestamp);
    }
}

function createMessengerWebSocketConnection() {
    messageWebsocket = new WebSocket(`ws://localhost:8080/api/privateMessages`);
    
    function handleNewMessageWebSocket(messageWebsocket, messageHandler) {
        messageWebsocket.addEventListener('open', (event) => {
            console.log('WebSocket connection opened:', event);
        });
    
        messageWebsocket.addEventListener('message', (event) => {
            console.log('WebSocket message received:', event.data);
            messageHandler(event.data);
        });
    
        messageWebsocket.addEventListener('close', (event) => {
            console.log('WebSocket connection closed:', event);
    
            if (event.wasClean) {
                console.log(`Connection closed cleanly, code: ${event.code}, reason: ${event.reason}`);
            } else {
                console.error(`Connection abruptly closed`);
            }
        });
    
        messageWebsocket.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }
    

    handleNewMessageWebSocket(messageWebsocket, (data) => {
        const newPrivateMessage = JSON.parse(data);

        const userListelement = document.querySelector(`#chatUsers p[receiver-id="${newPrivateMessage.sender_id}"]`);

        if (userListelement) {
            userListelement.classList.add('flashEffect');
            userListelement.textContent = `${userListelement.textContent} || New message`;
            chatUsers.insertBefore(userListelement, chatUsers.firstChild); // put the user on top when new message notification comes
        }
 
        const privateMessageElement = document.createElement('div');
        const formattedDateTime = formatDateTime(newPrivateMessage.timestamp);
        privateMessageElement.classList.add('message');
        if (newPrivateMessage.senderNickname === loggedInUser.nickname) {
            privateMessageElement.classList.add('sent');
        } else {
            privateMessageElement.classList.add('received');
        }

        if (newPrivateMessage.senderNickname !== undefined) {
            privateMessageElement.textContent = `${newPrivateMessage.senderNickname}, ${formattedDateTime}: ${newPrivateMessage.content}`;
          } else {
            privateMessageElement.textContent = ` ${newPrivateMessage.content}`;
          }
        chatMessages.appendChild(privateMessageElement);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    });  

    sendChatButton.removeEventListener('click', handleSendAction);
    sendChatButton.addEventListener('click', handleSendAction);
}

async function handleSendAction() {
    console.log('send button clicked');
    const senderId = loggedInUser.id; 
    const receiverId = parseInt(currentReceiverID);
    const senderNickname = loggedInUser.nickname; 
    const content = chatInput.value;
    const timestamp = new Date().toISOString();

    const privateMessage = {
        sender_id: senderId,
        receiver_id: receiverId,
        content: content,
        timestamp: timestamp,
        senderNickname: senderNickname,
    };

    if (messageWebsocket && messageWebsocket.readyState === WebSocket.OPEN) {
        messageWebsocket.send(JSON.stringify(privateMessage));
        chatInput.value = '';
        updateLastInteraction(receiverId, timestamp);
        updateChatUserList();
    } else {
        console.error('WebSocket connection is not open');
    }
}

let currentReceiverID = null;

async function fetchMessages(receiverID, loggedInUser) {
    currentReceiverID = receiverID;

    const authToken = getAuthToken();
    if (!authToken) {
        console.error("No auth token found.");
        return;
    }

    const response = await fetch(`/api/getMessages?receiverId=${receiverID}`, {
        headers: {
            Authorization: authToken
        }
    });
    if (!response.ok) {
        console.error("Error fetching messages:", await response.text());
        return;
    }

    const messages = await response.json();
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = ''; 

    if (messages && messages.length > 0) {
        messages.forEach((message) => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            if (message.senderNickname === loggedInUser.nickname) {
                messageElement.classList.add('sent');
            } else {
                messageElement.classList.add('received');
            }

            const formattedDateTime = formatDateTime(message.timestamp);
            messageElement.textContent = `${message.senderNickname}, ${formattedDateTime}: ${message.content}`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    } else {
        console.error('No messages to display.');
    }
}

chatUsers.addEventListener('click', (e) => {
    const divElement = e.target.closest('[receiver-id]');

    if (divElement) {
        const receiverId = divElement.getAttribute('receiver-id');
        const receiverNickname = divElement.textContent;
        const chatHeaderNickname = document.getElementById('chatHeaderNickname');
        chatHeaderNickname.textContent = receiverNickname;
        if (divElement.classList.contains('offline')) {
            // Display a message or alert to inform the user that the target user is offline
            alert(`${receiverNickname} is currently offline. You cannot send messages.`);
            return;
        }
        forumContent.style.display = 'block';
        postsFeed.style.display = 'block';
        chatContainer.style.display = 'block';

        fetchMessages(receiverId, loggedInUser);

        divElement.classList.remove('flashEffect');
    }
});

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const formattedDate = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
    const formattedTime = `${formattedDate} ${date.getHours()}:${date.getMinutes()}`;
    return formattedTime;
}


closeChatButton.addEventListener('click', function() {
    chatContainer.style.display = 'none';
});

registerButton.addEventListener('click', async function (event) {
    event.preventDefault();

    try {
        const registerNickname = document.getElementById('registerNickname').value;
        const registerAge = document.getElementById('registerAge').value;
        const registerGender = document.getElementById('registerGender').value;
        const registerFirstName = document.getElementById('registerFirstName').value;
        const registerLastName = document.getElementById('registerLastName').value;
        const registerEmail = document.getElementById('registerEmail').value;
        const registerPassword = document.getElementById('registerPassword').value;

        const requestBody = {
        nickname: registerNickname,
        age: registerAge,
        gender: registerGender,
        first_name: registerFirstName,
        last_name: registerLastName,
        email: registerEmail,
        password: registerPassword,
        };

        const response = await fetch(`/api/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        });

        if (response.ok) {
            window.location.href = '/';
        } else {
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = 'Nickname or email is already in use.';
        }
    } catch (error) {
        console.error('Registration error:', error);
    }
});

loginLink.addEventListener('click', function (event) {
    event.preventDefault();
    loginContainer.style.display = 'block';
    registerContainer.style.display = 'none';
});

registerLink.addEventListener('click', function (event) {
    event.preventDefault();
    loginContainer.style.display = 'none';
    registerContainer.style.display = 'block';
});

loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const formDataObject = {};
    formData.forEach((value, key) => {
        formDataObject[key] = value;
    });

    try {
        const response = await fetch(`/api/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataObject),
        });
        if (response.ok) {
            document.cookie = `session_id=${(await response.json()).session_id}; path=/; secure; SameSite=Strict`;
            toggleAuthenticationView();

            if (getAuthToken()) {
                createUserWebSocketConnection(await getLoggedInUser());
            }
        } else {
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = 'Wrong nickname or email.';
        }
    } catch (error) {
        console.error('Login error:', error);
    }
});

logoutButton.addEventListener('click', async function () {
    try {
        const response = await fetch(`/api/logout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `${getAuthToken()}`,
        },
        });

        if (response.ok) {
        deleteCookie('session_id');
        toggleAuthenticationView();

        if (postView.style.display === 'block') {
            postView.style.display = 'none';
            forumContent.style.display = 'block';
            postsFeed.style.display = 'block';
        }
        } else {
            console.error('Logout error:', response.status);
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
});

backToPostsFeedBtn.addEventListener('click', function () {
    postView.style.display = 'none';
    forumContent.style.display = 'block';
    postsFeed.style.display = 'block';
});

// create post
createPostButton.addEventListener('click', async function (event) {
    event.preventDefault();

    const postTitle = document.getElementById('postTitle').value;
    const postContent = document.getElementById('postContent').value;
    const postCategory = document.getElementById('postCategory').value;

    if (!postTitle || !postContent) {
        console.log('Please fill in both post title and content.');
        return;
    }

    try {
        const authToken = getAuthToken();
        if (!authToken) {
            console.log('User not authenticated.');
            return;
        }

        const response = await fetch(`/api/createPost`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: authToken,
        },
        body: JSON.stringify({
            title: postTitle,
            content: postContent,
            category: postCategory,
        }),
        });

        if (response.ok) {
            console.log('Post created successfully.');
            document.getElementById('postTitle').value = '';
            document.getElementById('postContent').value = '';
        await fetchAndDisplayPosts();
        } else {
            console.error('Failed to create post:', response.status);
        }
    } catch (error) {
        console.error('Post creation error:', error);
    }
});

async function fetchAndDisplayPosts() {
    try {
        const response = await fetch(`/api/posts`);
        if (response.ok) {
            const posts = await response.json();
            const postsList = document.getElementById('postsList');

            postsList.innerHTML = '';

            posts.forEach((post) => {
                const postElement = document.createElement('div');
                postElement.className = 'post';
                postElement.innerHTML = `
                    <div data-id='${post.id}'>
                    <h3>${post.title}</h3>
                    <p>${post.content.replace(/\n/g, '<br>')}</p>
                    <p>Created at: ${post.formattedTime}</p>
                    </div>
                `;

                postElement.addEventListener('mouseover', () => {
                postElement.style.cursor = 'pointer';
                postElement.style.backgroundColor = '#f0f0f0';
                });

                postElement.addEventListener('mouseout', () => {
                postElement.style.cursor = 'default';
                postElement.style.backgroundColor = 'transparent';
                });

                postsList.appendChild(postElement);
            });
        } else {
            console.error('Failed to fetch posts:', response.status);
        }
    } catch (error) {
        console.error('Fetching posts error:', error);
    }
}

let currentPostID = null;

async function displaySelectedPost(postID) {
    currentPostID = postID;
    try {
        const response = await fetch(`/api/postWithComments?postId=${postID}`);
        if (response.ok) {
            const data = await response.json();
            console.log(data)

            const postDetails = data.post;
            document.getElementById('title').innerHTML = postDetails.title;
            document.getElementById('nickname').innerHTML = postDetails.nickname;
            document.getElementById('content').innerHTML = postDetails.content.replace(/\n/g, '<br>');
            document.getElementById('createdAt').innerHTML = postDetails.formattedTime;
            document.getElementById('category').innerHTML = postDetails.category;

            const comments = data.comments;
            const commentsList = document.getElementById('commentsList');
            commentsList.innerHTML = '';
            comments.forEach((comment) => {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';

                const nicknameElement = document.createElement('p');
                nicknameElement.className = 'nicknameElement';
                nicknameElement.innerText = comment.nickname;

                const contentElement = document.createElement('p');
                contentElement.className = 'contentElement';
                contentElement.innerText = comment.content;

                commentElement.appendChild(nicknameElement);
                commentElement.appendChild(contentElement);
                commentsList.appendChild(commentElement);
            });
        } else {
            console.error('Failed fetching comments', response.statusText);
        }
    } catch (error) {
        console.error(error);
    }
}

function getCurrentPostID() {
    return currentPostID;
}

// create a comment
// Modify createCommentButton event listener
createCommentButton.addEventListener('click', async function (event) {
    event.preventDefault();

    const commentContent = document.getElementById('commentContent').value;
    const postID = parseInt(getCurrentPostID(), 10);
    if (!postID) {
        console.error('No post selected');
        return;
    }

    if (!commentContent) {
        console.log('Please fill in the comment content.');
        return;
    }

    try {
        const authToken = getAuthToken();
        if (!authToken) {
            console.log('User not authenticated.');
            return;
        }

        const response = await fetch(`/api/createComment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: authToken,
        },
        body: JSON.stringify({
            content: commentContent,
            post_id: postID,
        }),
        });

        if (response.ok) {
            console.log('Comment created successfully.');
            document.getElementById('commentContent').value = '';
        await displaySelectedPost(postID);
        } else {
            console.error('Failed to create comment:', response.status);
        }
    } catch (error) {
        console.error('Comment creation error:', error);
    }
});

function getAuthToken() {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
        const [name, value] = cookie.split('=');
        if (name === 'session_id') {
            return decodeURIComponent(value);
        }
    }
    return null;
}

function deleteCookie(cookieName) {
    const pastDate = new Date(0);
    document.cookie = `${cookieName}=; expires=${pastDate.toUTCString()}; path=/; secure; SameSite=Strict`;
}

async function toggleAuthenticationView() {
    loggedInUser = await getLoggedInUser();
    if (loggedInUser) {
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'none';
        forumContent.style.display = 'block';
        logoutButton.style.display = 'block';
        userInfo.style.display = 'block';
        chatContainer.style.display = 'none';
        messageNotification.style.display = 'none';
    } else {
        loginContainer.style.display = 'block';
        registerContainer.style.display = 'none';
        forumContent.style.display = 'none';
        logoutButton.style.display = 'none';
        userInfo.style.display = 'none';
        chatContainer.style.display = 'none';
        messageNotification.style.display = 'none';
    }
}

async function getLoggedInUser() {
    try {
        const authToken = getAuthToken();
        if (!authToken) {
            return;
        }

        const response = await fetch(`/api/loggedInUser`, {
        headers: {
            Authorization: authToken,
        },
        });

        if (response.ok) {
            const responseData = await response.json();

            loggedInNicknameElement.textContent = responseData.nickname;

            const loggedInUserDisplay = document.getElementById('loggedInUserDisplay');
            loggedInUserDisplay.style.display = 'block';

            return responseData;
        } else {
            console.error('Failed to get logged-in user, Status:', response.status);
        }
    } catch (error) {
        console.error('Failed to fetch logged-in user details:', error);
    }
}
