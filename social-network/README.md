# social-network

## Table of Contents
- ### [General Information](#general-information)
- ### [Technologies](#technologies)
- ### [Setup](#setup)
- ### [Usage](#usage)
- ### [Usage with Docker](#usage-with-docker)
- ### [Authors](#authors)

## General Information
    This project is a Facebook-like social network that contains the following features: posting, group and event creation, commenting, following, chats, notifications and profile.

Registration and Login:

- Users are required to register and log in to access the forum.
- The registration form includes fields such as Email, Password, First Name, Last Name, Date of Birth, Avatar/Image (Optional), Nickname (Optional), About Me (Optional).
- Users can log in using their email and the password.
- Log out functionality is available on all pages.

Posts and Comments:

- Users can create posts about any topic.
- Comments can be added to posts.
- Posts are displayed in a feed format.
- Comments are visible when a user clicks on a specific post.
- You can choose to add JPEG, PNG or GIF image to your post or comment.
- You can specify privacy of the post: it can be public (all users in the social network will be able to see the post), private (only followers of the creator of the post will be able to see the post), almost private (only the followers chosen by the creator of the post will be able to see it)

Personal profile contains:

- User's registration information.
- List of posts created by the user.
- Followers and following users. 

Groups and Events:

A user is able to create a group. The group should have a title and a description given by the creator and he/she can invite other users to join the group.

The invited users need to accept the invitation to be part of the group. They can also invite other people once they are already part of the group. Another way to enter the group is to request to be in it and only the creator of the group would be allowed to accept or refuse the request.

To make a request to enter a group the user must find it first. This will be possible by having a section where you can browse through all groups.

When in a group, a user can create posts and comment the posts already created. These posts and comments will only be displayed to members of the group.

A user belonging to the group can also create an event, making it available for the other group users. An event should have:
- Title
- Description
- Day/Time
- 2 Options (at least): `Going`, `Not going`

Private Messages:

- Users can send private messages to each other.
- A chat section is created to facilitate private messaging.
- The chat section remains visible at all times.
- Groups have common chat room

## Technologies
- Next.js
- Golang
- React
- TypeScript
- Tailwind CSS
- SQLite
- Nginx

## Setup
Clone the repository
```
git clone https://01.kood.tech/git/martinilbi/social-network/
```
Proceed to next step.

## Usage with Docker
Project is launched using docker-compose. You can run the app using:
```
sudo bash runApp.sh
```
This will install all the required files into docker and launch it for you. 
To access the app, visit 
```
http://localhost/
```

## Authors
- Martin Ilbi
- Ragnar Küüsmaa
- Iryna Velychko
- Samuel Uzoagba
- Herald Raudberg
- Alexander Pepelyaev
