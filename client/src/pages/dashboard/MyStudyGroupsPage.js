import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import Preloader from '../../components/common/Preloader';
import { FiSend, FiPaperclip, FiMic, FiPlusCircle, FiSearch, FiMessageSquare, FiX } from 'react-icons/fi';
import { Modal, ModalText, ModalButtonContainer, ModalButton } from '../../components/common/Modal';

// --- Styled Components for the Chat Layout ---

const ChatPageContainer = styled.div`
  display: flex;
  height: calc(100vh - 100px); /* Full height minus dashboard header */
  background-color: #1e1e2d;
  color: white;
  border-radius: 12px;
  overflow: hidden;
`;

const SidebarPanel = styled.div`
  width: 30%;
  min-width: 300px;
  max-width: 400px;
  border-right: 1px solid #444;
  display: flex;
  flex-direction: column;
  background-color: #26262e;
`;

const ChatWindowPanel = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: #1e1e2d;
`;

const SidebarHeader = styled.div`
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #444;

  h2 {
    margin: 0;
    font-size: 1.2rem;
  }
`;

const CreateGroupButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
`;

const SearchBarContainer = styled.div`
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #444;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #1e1e2d;
`;

const SearchInput = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  color: white;
  padding: 0.5rem;
  font-size: 1rem;
  &:focus {
    outline: none;
  }
`;

const ConversationList = styled.div`
  flex-grow: 1;
  overflow-y: auto;
`;

const ConversationItem = styled.div`
  padding: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: ${({ active }) => (active ? '#33333d' : 'transparent')};
  border-bottom: 1px solid #2a2a3e;

  &:hover {
    background-color: #33333d;
  }
`;

const AvatarPlaceholder = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  color: #1e1e2d;
  flex-shrink: 0;
`;

const ConversationDetails = styled.div`
  flex-grow: 1;
  overflow: hidden;
  h4 {
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  p {
    margin: 0;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const WelcomeScreen = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
`;

const ChatHeader = styled.div`
  padding: 0.8rem 1.5rem;
  border-bottom: 1px solid #444;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
`;

const MessageContainer = styled.div`
  flex-grow: 1;
  padding: 1rem 2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${({ isSender }) => (isSender ? 'flex-end' : 'flex-start')};
`;

const SenderName = styled.div`
  font-size: 0.8rem;
  color: #a0a0a0;
  margin-bottom: 4px;
  margin-left: ${({ isSender }) => (isSender ? '0' : '10px')};
  margin-right: ${({ isSender }) => (isSender ? '10px' : '0')};
`;

const MessageBubble = styled.div`
  max-width: 65%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  margin-bottom: 0.5rem;
  background-color: ${({ isSender, theme }) => (isSender ? '#005C4B' : '#33333d')};
  color: white;
  align-self: ${({ isSender }) => (isSender ? 'flex-end' : 'flex-start')};
  line-height: 1.4;
`;

const Timestamp = styled.div`
  font-size: 0.7rem;
  color: #a0a0a0;
  text-align: right;
  margin-top: 4px;
`;

const MessageInputForm = styled.form`
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #2a2a3e;
  gap: 1rem;
`;

const MessageInput = styled.input`
  flex-grow: 1;
  padding: 0.8rem 1rem;
  border: none;
  border-radius: 8px;
  background-color: #33333d;
  color: white;
  font-size: 1rem;
  &:focus {
    outline: none;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
`;

const ModalInput = styled.input`
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  border: 1px solid #555;
  background-color: #1e1e2d;
  color: white;
  font-size: 1rem;
`;

const UserSearchResultList = styled.div`
  max-height: 150px;
  overflow-y: auto;
  margin-top: 0.5rem;
`;

const UserTag = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.background};
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  margin: 0.2rem;
  font-weight: 500;
`;

const RemoveUserButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.background};
  margin-left: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
`;

// --- Main Component Logic ---
const ENDPOINT = "http://localhost:5000";
let socket;

const MyStudyGroupsPage = () => {
    const { t } = useTranslation();
    const [user, setUser] = useState(null);
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // State for Create Group Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

    const messagesEndRef = useRef(null);

    const fetchChats = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const { data } = await axios.get('/api/studygroup', config);
            setChats(data);
        } catch (error) {
            console.error("Failed to fetch chats");
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            const config = { headers: { 'x-auth-token': token } };
            const { data } = await axios.get('/api/dashboard', config);
            setUser(data.user);

            socket = io(ENDPOINT);
            socket.emit('setup', data.user);
            
            await fetchChats();
            setLoading(false);
        };
        init();
    }, [fetchChats]);

    useEffect(() => {
        if (!socket) return;
        const messageListener = (newMessageReceived) => {
            if (selectedChat?._id === newMessageReceived.studyGroup?._id) {
                setMessages(prev => [...prev, newMessageReceived]);
            }
            fetchChats();
        };
        socket.on('message received', messageListener);
        return () => socket.off('message received', messageListener);
    }, [socket, selectedChat, fetchChats]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSelectChat = async (chat) => {
        setSelectedChat(chat);
        socket.emit('join chat', chat._id);
        
        try {
            setLoadingMessages(true);
            const token = localStorage.getItem('token');
            const config = { headers: { "x-auth-token": token } };
            const { data } = await axios.get(`/api/message/${chat._id}`, config);
            setMessages(data);
        } catch (error) {
            console.error("Failed to fetch messages for chat");
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage && selectedChat && user) {
            socket.emit('new message', {
                sender: { _id: user.id },
                content: newMessage,
                studyGroup: selectedChat,
            });
            setNewMessage('');
        }
    };

    const handleUserSearch = async (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        try {
            setLoadingSearch(true);
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const { data } = await axios.get(`/api/studygroup/users?search=${query}`, config);
            setSearchResults(data);
        } catch (error) {
            console.error("Failed to search users");
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleAddUser = (userToAdd) => {
        if (!selectedUsers.some(u => u._id === userToAdd._id)) {
            setSelectedUsers([...selectedUsers, userToAdd]);
        }
    };

    const handleRemoveUser = (userToRemove) => {
        setSelectedUsers(selectedUsers.filter(u => u._id !== userToRemove._id));
    };

    const handleCreateGroup = async () => {
        if (!groupName || !groupDescription || selectedUsers.length < 1) {
            setErrorModal({ 
                isOpen: true, 
                message: t('study_groups.validation_error', {defaultValue: "Please provide a group name, description, and select at least one member."}) 
            });
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const { data } = await axios.post('/api/studygroup/group', {
                name: groupName,
                description: groupDescription,
                users: JSON.stringify(selectedUsers.map(u => u._id)),
            }, config);
            
            setChats([data, ...chats]);
            setIsModalOpen(false);
            setGroupName('');
            setGroupDescription('');
            setSelectedUsers([]);
            setSearchQuery('');
        } catch (error) {
            console.error("Failed to create group chat", error);
        }
    };

    const getChatPartner = (chat) => {
        if (!user || !chat.users || chat.isGroupChat) return null;
        return chat.users.find(u => u._id !== user.id);
    };

    if (loading) return <Preloader />;

    return (
        <>
            <Modal 
                isOpen={errorModal.isOpen} 
                onClose={() => setErrorModal({ isOpen: false, message: '' })} 
                title="Incomplete Information"
            >
                <ModalText>{errorModal.message}</ModalText>
                <ModalButtonContainer>
                    <ModalButton primary onClick={() => setErrorModal({ isOpen: false, message: '' })}>OK</ModalButton>
                </ModalButtonContainer>
            </Modal>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create a New Study Group">
                <ModalInput
                    placeholder="Group Name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                />
                <ModalInput
                    placeholder="Group Description"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                />
                <ModalInput
                    placeholder="Search users to add..."
                    value={searchQuery}
                    onChange={(e) => handleUserSearch(e.target.value)}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '1rem', minHeight: '30px' }}>
                    {selectedUsers.map(u => (
                        <UserTag key={u._id}>
                            {u.firstName}
                            <RemoveUserButton onClick={() => handleRemoveUser(u)}><FiX /></RemoveUserButton>
                        </UserTag>
                    ))}
                </div>
                <UserSearchResultList>
                    {loadingSearch ? <p>Searching...</p> : searchResults?.slice(0, 4).map(userResult => (
                        <ConversationItem key={userResult._id} onClick={() => handleAddUser(userResult)}>
                            <ConversationDetails>
                                <h4>{userResult.firstName} {userResult.lastName}</h4>
                                <p>{userResult.email}</p>
                            </ConversationDetails>
                        </ConversationItem>
                    ))}
                </UserSearchResultList>
                <ModalButtonContainer>
                    <ModalButton onClick={() => setIsModalOpen(false)}>Cancel</ModalButton>
                    <ModalButton primary onClick={handleCreateGroup}>Create Group</ModalButton>
                </ModalButtonContainer>
            </Modal>

            <ChatPageContainer>
                <SidebarPanel>
                    <SidebarHeader>
                        <h2>{t('sidebar.my_study_groups')}</h2>
                        <CreateGroupButton title="Create Study Group" onClick={() => setIsModalOpen(true)}>
                            <FiPlusCircle />
                        </CreateGroupButton>
                    </SidebarHeader>
                    <SearchBarContainer>
                        <FiSearch />
                        <SearchInput placeholder="Search or start a new chat..." />
                    </SearchBarContainer>
                    <ConversationList>
                        {chats.map(chat => {
                            const partner = getChatPartner(chat);
                            const displayName = chat.isGroupChat ? chat.name : `${partner?.firstName} ${partner?.lastName}`;
                            const avatarText = (chat.isGroupChat ? chat.name : partner?.firstName)?.substring(0, 2).toUpperCase();

                            return (
                                <ConversationItem key={chat._id} onClick={() => handleSelectChat(chat)} active={selectedChat?._id === chat._id}>
                                    <AvatarPlaceholder>{avatarText}</AvatarPlaceholder>
                                    <ConversationDetails>
                                        <h4>{displayName}</h4>
                                        <p>{chat.latestMessage?.content || 'No messages yet'}</p>
                                    </ConversationDetails>
                                </ConversationItem>
                            );
                        })}
                    </ConversationList>
                </SidebarPanel>
                
                <ChatWindowPanel>
                    {selectedChat ? (
                        <>
                            <ChatHeader>
                                <AvatarPlaceholder>
                                    {selectedChat.isGroupChat ? selectedChat.name.substring(0, 2).toUpperCase() : getChatPartner(selectedChat)?.firstName.substring(0, 2).toUpperCase()}
                                </AvatarPlaceholder>
                                <h3>{selectedChat.isGroupChat ? selectedChat.name : `${getChatPartner(selectedChat)?.firstName} ${getChatPartner(selectedChat)?.lastName}`}</h3>
                            </ChatHeader>
                            <MessageContainer>
                                {loadingMessages ? <Preloader /> : messages.map((msg, i) => {
                                    const isSender = msg.sender._id === user.id;
                                    return (
                                        <MessageWrapper key={i} isSender={isSender}>
                                            {selectedChat.isGroupChat && !isSender && (
                                                <SenderName isSender={isSender}>{msg.sender.firstName}</SenderName>
                                            )}
                                            <MessageBubble isSender={isSender}>
                                                {msg.content}
                                                <Timestamp>{format(new Date(msg.createdAt || Date.now()), 'p')}</Timestamp>
                                            </MessageBubble>
                                        </MessageWrapper>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </MessageContainer>
                            <MessageInputForm onSubmit={handleSendMessage}>
                                <IconButton type="button" title="Attach File"><FiPaperclip /></IconButton>
                                <IconButton type="button" title="Record Voice Message"><FiMic /></IconButton>
                                <MessageInput 
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <IconButton type="submit" title="Send Message"><FiSend /></IconButton>
                            </MessageInputForm>
                        </>
                    ) : (
                        <WelcomeScreen>
                            <FiMessageSquare size={100} />
                            <h2>SeekMYCOURSE Chats</h2>
                            <p>Create or select a conversation to start messaging.</p>
                        </WelcomeScreen>
                    )}
                </ChatWindowPanel>
            </ChatPageContainer>
        </>
    );
};

export default MyStudyGroupsPage;