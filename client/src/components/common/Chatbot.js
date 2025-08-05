import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FiX, FiSend, FiSearch, FiMinimize2, FiMaximize2, FiMessageCircle } from 'react-icons/fi';
import axios from 'axios';
import chatbotAvatar from '../../assets/Tanisi-Bot.jpg';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

// Bouncing animation for the avatar
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-15px);
  }
  60% {
    transform: translateY(-8px);
  }
`;

// Spinner animation (reused from Preloader)
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Define fixed offsets for vertical positioning
const chatbotIconHeight = '60px';
const chatbotIconBottomOffset = '20px';
const notesIconVerticalSpacing = '10px';

const ChatbotContainer = styled.div`
  position: fixed;
  bottom: ${chatbotIconBottomOffset};
  width: ${chatbotIconHeight};
  height: ${chatbotIconHeight};
  border-radius: 50%;
  
  z-index: 1000;
  cursor: pointer;
  
  ${({ $isRTL, $fixedOffset = '20px' }) => $isRTL ? css`
    left: ${$fixedOffset};
    right: unset;
  ` : css`
    right: ${$fixedOffset};
    left: unset;
  `}
`;

const AvatarContainer = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #1e1e2d;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  animation: ${bounce} 2s ease-in-out infinite;
  animation-delay: 2s;
  overflow: hidden;
`;

const Avatar = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
`;

const Bubble = styled.div`
  position: absolute;
  bottom: 75px;
  background-color: white;
  color: #333;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  width: 220px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  font-size: 0.85rem;
  line-height: 1.4;
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  transform: ${({ $show }) => ($show ? 'translateY(0)' : 'translateY(10px)')};
  transition: opacity 0.3s, transform 0.3s;
  pointer-events: ${({ $show }) => ($show ? 'auto' : 'none')};

  ${({ $isRTL }) => ($isRTL ? css`
    left: 5px;
    right: unset;
  ` : css`
    right: 5px;
    left: unset;
  `)}

  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    ${({ $isRTL }) => ($isRTL ? 'left: 20px;' : 'right: 20px;')}
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid white;
  }
`;

const CloseBubbleButton = styled.button`
  position: absolute;
  top: 5px;
  ${({ $isRTL }) => ($isRTL ? 'left: 5px;' : 'right: 5px;')}
  background: transparent;
  border: none;
  color: #888;
  font-size: 1rem;
  cursor: pointer;
  padding: 5px;
  line-height: 1;

  &:hover {
    color: #000;
  }
`;

const SideModal = styled.div`
  position: fixed;
  top: 0;
  height: 100%;
  background-color: #1e1e2d;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  
  /* --- CHANGE #1: MODAL WIDTH --- */
  width: 950px;
  
  ${({ $isOpen, $isRTL }) =>
    $isRTL
      ? css`
          right: unset;
          left: ${$isOpen ? '0px' : '-950px'}; /* Adjusted width */
          border-left: 1px solid #444;
          border-right: none;
        `
      : css`
          left: unset;
          right: ${$isOpen ? '0px' : '-950px'}; /* Adjusted width */
          border-right: 1px solid #444;
          border-left: none;
        `}
  
  transition: all 0.3s ease-in-out;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background-color: #2a2a3e;
  border-bottom: 1px solid #444;

  h2 {
    margin: 0;
    font-size: 1.2rem;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
`;

const ModalIntro = styled.div`
  padding: 1rem 1.5rem;
  background-color: #2a2a3e;
  border-bottom: 1px solid #444;
  text-align: center;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SearchContainer = styled.div`
  padding: 0.5rem 1.5rem;
  border-bottom: 1px solid #444;
  display: flex;
  align-items: center;
  background-color: #2a2a3e;
  flex-direction: ${({ $isRTL }) => ($isRTL ? 'row-reverse' : 'row')};
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
  margin-right: ${({ $isRTL }) => ($isRTL ? '0' : '0.5rem')};
  margin-left: ${({ $isRTL }) => ($isRTL ? '0.5rem' : '0')};
`;

const ChatWindow = styled.div`
  flex-grow: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 80%;
  align-self: ${({ $isUser, $isRTL }) => {
    if ($isRTL) {
        return $isUser ? 'flex-start' : 'flex-end';
    } else {
        return $isUser ? 'flex-end' : 'flex-start';
    }
}};
  align-items: ${({ $isUser, $isRTL }) => {
    if ($isRTL) {
        return $isUser ? 'flex-start' : 'flex-end';
    } else {
        return $isUser ? 'flex-end' : 'flex-start';
    }
}};
`;

const MessageBubble = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background-color: ${({ isUser, theme }) => (isUser ? theme.colors.primary : '#33333d')};
  color: ${({ isUser, theme }) => (isUser ? theme.colors.background : 'white')};
  
  /* --- CHANGE #2: LIST STYLING --- */
  ul, ol {
    padding-inline-start: 25px;
    margin-block-start: 0.5em;
    margin-block-end: 0.5em;
  }
`;

const Timestamp = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 0.25rem;
  padding: 0 0.5rem;
`;

const ChatInputContainer = styled.form`
  display: flex;
  padding: 1rem;
  border-top: 1px solid #444;
  align-items: flex-start;
  flex-direction: ${({ $isRTL }) => ($isRTL ? 'row-reverse' : 'row')};
`;

const ChatTextarea = styled.textarea`
  flex-grow: 1;
  padding: 0.75rem;
  border: 1px solid #555;
  border-radius: 6px;
  background-color: #33333d;
  color: white;
  margin-right: ${({ $isRTL }) => ($isRTL ? '0' : '0.5rem')};
  margin-left: ${({ $isRTL }) => ($isRTL ? '0.5rem' : '0')};
  resize: none;
  min-height: 40px;
  max-height: 120px;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.4;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SendButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  border: none;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1e1e2d;
`;

const CompletionMessage = styled(MessageBubble)`
    text-align: center;
    background-color: #03453f;
    color: ${({ theme }) => theme.colors.primary};
    border: 1px solid ${({ theme }) => theme.colors.primary};
    margin: 1rem auto;
    max-width: 90%;
`;

const InlineSpinner = styled.div`
  border: 3px solid #f3f3f3;
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: ${spin} 1s linear infinite;
  margin-right: 8px;
`;

const AITypingIndicator = styled.div`
  display: flex;
  align-items: center;
  align-self: ${({ $isRTL }) => ($isRTL ? 'flex-end' : 'flex-start')};
  margin-top: 10px;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;


const Chatbot = ({ course, courseCompletedAndPassed, isRTL, fixedSideOffset = '20px', lessonContent }) => {
  const { t } = useTranslation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAITyping, setIsAITyping] = useState(false); 
  const chatWindowRef = useRef(null);

  const courseTopicForTranslation = course?.topic || 'this Course'; 

  // --- MODIFIED: Fetch chat history from the API when the modal opens ---
  useEffect(() => {
    const fetchChatHistory = async () => {
        if (isModalOpen && course?._id) {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { 'x-auth-token': token } };
                const res = await axios.get(`/api/course/chat/${course._id}`, config);
                setMessages(res.data);
            } catch (error) {
                console.error("Failed to load chat history from DB:", error);
                // Optionally show an error message in chat
                setMessages([{
                    text: t('errors.chatbot_connection_error'),
                    isUser: false,
                    timestamp: new Date()
                }]);
            }
        }
    };

    fetchChatHistory();
  }, [isModalOpen, course?._id, t]);

  // --- MODIFIED: Scroll to bottom whenever messages update ---
  useEffect(() => {
    if (chatWindowRef.current) {
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setShowBubble(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCloseBubble = (e) => {
    e.stopPropagation();
    setShowBubble(false);
  };

  // --- MODIFIED: `handleSendMessage` now optimistically updates the UI ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || courseCompletedAndPassed || !course?._id || isAITyping) return; 

    const userMessage = { text: userInput, isUser: true, timestamp: new Date() };
    const currentInput = userInput;
    
    // Optimistically update the UI with the user's message
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setUserInput('');
    setIsAITyping(true); 
    
    try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token }};
        
        // Pass previous messages for context
        const chatHistoryForApi = messages.slice(-10); // Send last 10 messages for context

        const body = { 
            courseId: course._id, 
            userQuery: currentInput, 
            lessonContent,
            chatHistory: chatHistoryForApi 
        };
        const res = await axios.post('/api/course/chatbot', body, config);
        
        const aiMessage = { text: res.data.response, isUser: false, timestamp: new Date() };
        
        // Update the UI with the AI's response
        setMessages(prevMessages => [...prevMessages, aiMessage]);

    } catch (error) {
        console.error("Chatbot API error:", error);
        const errorMessage = { 
            text: t('errors.chatbot_connection_error', { defaultValue: 'Sorry, something went wrong. Please try again.' }), 
            isUser: false, 
            timestamp: new Date() 
        };
        // If the API call fails, add an error message to the chat
        setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
        setIsAITyping(false); 
    }
  };
  
  const filteredMessages = messages.filter(msg => 
    msg.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <AnimatePresence>
        {!isModalOpen && (
          <ChatbotContainer onClick={handleOpenModal} $isRTL={isRTL} $fixedOffset={fixedSideOffset}>
            <Bubble $show={showBubble && !isModalOpen} $isRTL={isRTL}>
                <CloseBubbleButton onClick={handleCloseBubble} $isRTL={isRTL}>
                    <FiX />
                </CloseBubbleButton>
                {t('chatbot_welcome_bubble', { courseTopic: courseTopicForTranslation })}
            </Bubble>
            <AvatarContainer>
                <Avatar src={chatbotAvatar} alt="TANISI AI Tutor" />
            </AvatarContainer>
          </ChatbotContainer>
        )}

        {isModalOpen && (
          <SideModal 
            $isOpen={isModalOpen} 
            $isRTL={isRTL} 
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <ModalHeader>
              <h2>{t('tanisi_ai_tutor')}</h2>
              <CloseButton onClick={handleCloseModal}><FiX /></CloseButton>
            </ModalHeader>
            <ModalIntro>
               {t('chatbot_modal_intro', { courseTopic: courseTopicForTranslation })}
            </ModalIntro>
            <SearchContainer $isRTL={isRTL}>
                <FiSearch style={{ color: '#888', marginRight: isRTL ? '0' : '0.5rem', marginLeft: isRTL ? '0.5rem' : '0' }} />
                <SearchInput
                    type="text"
                    placeholder={courseCompletedAndPassed ? t('chatbot_disabled_input_placeholder') : t('chatbot_active_input_placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={courseCompletedAndPassed} 
                    dir={isRTL ? 'rtl' : 'ltr'}
                    $isRTL={isRTL}
                />
            </SearchContainer>

            {courseCompletedAndPassed && (
                <CompletionMessage>
                    {t('chatbot_course_completed_message')}
                </CompletionMessage>
            )}

            <ChatWindow ref={chatWindowRef}>
              {filteredMessages.map((msg, index) => (
                <MessageContainer key={index} $isUser={msg.isUser} $isRTL={isRTL}>
                  <MessageBubble isUser={msg.isUser}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </MessageBubble>
                  <Timestamp>{format(new Date(msg.timestamp), 'MMM d, h:mm a')}</Timestamp>
                </MessageContainer>
              ))}
              {isAITyping && (
                <AITypingIndicator $isRTL={isRTL}>
                    <InlineSpinner />
                    <span>{t('errors.chatbot_typing_message')}</span>
                </AITypingIndicator>
              )}
            </ChatWindow>
            <ChatInputContainer as="form" onSubmit={handleSendMessage} $isRTL={isRTL}>
              <ChatTextarea
                placeholder={courseCompletedAndPassed ? t('chatbot_disabled_input_placeholder') : t('chatbot_active_input_placeholder')}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                    }
                }}
                rows={1}
                onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                disabled={courseCompletedAndPassed || isAITyping} 
                dir={isRTL ? 'rtl' : 'ltr'}
                $isRTL={isRTL}
              />
              <SendButton type="submit" disabled={courseCompletedAndPassed || isAITyping}><FiSend /></SendButton> 
            </ChatInputContainer>
          </SideModal>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;