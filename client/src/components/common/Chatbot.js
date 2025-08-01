// client/src/components/common/Chatbot.js
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FiX, FiSend, FiSearch } from 'react-icons/fi';
import axios from 'axios';
import chatbotAvatar from '../../assets/Tanisi-Bot.jpg';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';


// Bouncing animation for the avatar
// Bouncing animation for the avatar
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-15px); /* Reduced bounce height */
  }
  60% {
    transform: translateY(-8px); /* Reduced bounce height */
  }
`;

// Spinner animation (reused from Preloader)
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Define fixed offsets for vertical positioning
const chatbotIconHeight = '60px'; // Assuming chatbot icon is 60px height
const chatbotIconBottomOffset = '20px'; // From Chatbot.js
const notesIconVerticalSpacing = '10px'; // Space between notes icon and chatbot icon


const ChatbotContainer = styled.div`
  position: fixed;
  bottom: ${chatbotIconBottomOffset}; /* Adjust from the bottom of the viewport */
  width: ${chatbotIconHeight}; /* Fixed width for the clickable icon area */
  height: ${chatbotIconHeight}; /* Fixed height */
  border-radius: 50%; /* Make it round */
  
  z-index: 1000;
  cursor: pointer;
  
  // Position based on fixedOffset (padding from edge of screen) and RTL
  ${({ $isRTL, $fixedOffset = '20px' }) => $isRTL ? css`
    left: ${$fixedOffset}; /* In RTL, icons are on the left, offset by fixedOffset */
    right: unset;
  ` : css`
    right: ${$fixedOffset}; /* In LTR, icons are on the right, offset by fixedOffset */
    left: unset;
  `}
`;

// New container for the circular background
const AvatarContainer = styled.div`
  width: 60px; /* Fixed width for the clickable icon area */
  height: 60px; /* Fixed height */
  border-radius: 50%;
  background-color: #1e1e2d;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  animation: ${bounce} 2s ease-in-out infinite;
  animation-delay: 2s; /* Delay initial animation slightly */
  overflow: hidden; /* Ensure image doesn't break circular shape */
`;

// Adjusted styles for the image itself
const Avatar = styled.img`
  width: 100%; /* Fill the container */
  height: 100%; /* Fill the container */
  object-fit: cover; /* Cover the area, may crop */
  border-radius: 50%; /* Keep image circular */
`;

const Bubble = styled.div`
  position: absolute;
  bottom: 75px; /* Position above the smaller avatar container (60px icon height + 15px spacing) */
  background-color: white;
  color: #333;
  padding: 0.75rem 1rem; /* Slightly reduced padding */
  border-radius: 12px;
  width: 220px; /* Reduced width for the bubble */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  font-size: 0.85rem; /* Slightly smaller font size */
  line-height: 1.4;
  opacity: ${({ $show }) => ($show ? 1 : 0)}; /* Use $show for transient prop */
  transform: ${({ $show }) => ($show ? 'translateY(0)' : 'translateY(10px)')}; /* Use $show */
  transition: opacity 0.3s, transform 0.3s;
  pointer-events: ${({ $show }) => ($show ? 'auto' : 'none')}; /* Use $show */

  // Position the bubble relative to the ChatbotContainer.
  // This will ensure it's on the correct side above the icon.
  ${({ $isRTL }) => ($isRTL ? css`
    left: 5px; /* Offset from the left edge of its parent ChatbotContainer */
    right: unset;
  ` : css`
    right: 5px; /* Offset from the right edge of its parent ChatbotContainer */
    left: unset;
  `)}

  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    // Tail position centered relative to the bubble itself
    ${({ $isRTL }) => ($isRTL ? 'left: 20px;' : 'right: 20px;')} /* Adjust tail position for smaller bubble */
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
  // Position relative to bubble container
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
  
  // Modal position (always from the side of the screen)
  ${({ $isOpen, $isRTL }) =>
    $isRTL
      ? css`
          right: unset;
          left: ${$isOpen ? '0px' : '-360px'}; /* Slide in from left for RTL */
          border-left: 1px solid #444;
          border-right: none;
        `
      : css`
          left: unset;
          right: ${$isOpen ? '0px' : '-360px'}; /* Slide in from right for LTR */
          border-right: 1px solid #444;
          border-left: none;
        `}
  width: 360px; /* Fixed width of the modal */
  transition: all 0.3s ease-in-out; /* Transition all properties for smooth movement */
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


const Chatbot = ({ course, courseCompletedAndPassed, isRTL, fixedSideOffset = '20px' }) => { // Renamed prop for clarity
  const { t } = useTranslation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAITyping, setIsAITyping] = useState(false); 
  const chatWindowRef = useRef(null);

  const courseTopicForTranslation = course?.topic || 'this Course'; 
  const storageKey = `tanisi-chat-${course?._id || 'default'}`;

  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem(storageKey);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
      setMessages([]);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
        console.error("Failed to save chat history:", error);
    }
    if (chatWindowRef.current) {
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, storageKey]);

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || courseCompletedAndPassed || !course?._id || isAITyping) return; 

    const userMessage = { text: userInput, isUser: true, timestamp: new Date() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setUserInput('');
    setIsAITyping(true); 
    
    try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token }};
        const body = { courseId: course._id, userQuery: userInput };
        const res = await axios.post('/api/course/chatbot', body, config);
        
        setMessages([...newMessages, { text: res.data.response, isUser: false, timestamp: new Date() }]);
    } catch (error) {
        console.error("Chatbot API error:", error);
        setMessages([...newMessages, { text: t('errors.chatbot_connection_error', { defaultValue: 'Sorry, something went wrong. Please try again.' }), isUser: false, timestamp: new Date() }]);
    } finally {
        setIsAITyping(false); 
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <AnimatePresence> {/* Only use AnimatePresence if framer-motion is installed */}
        {!isModalOpen && (
          <ChatbotContainer onClick={handleOpenModal} $isRTL={isRTL} $fixedOffset={fixedSideOffset}> {/* Use fixedSideOffset directly */}
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
                    {msg.text}
                  </MessageBubble>
                  <Timestamp>{format(new Date(msg.timestamp), 'MMM d, h:mm a')}</Timestamp>
                </MessageContainer>
              ))}
              {isAITyping && (
                <AITypingIndicator $isRTL={isRTL}>
                    <InlineSpinner />
                    <span>{t('chatbot_typing_message')}</span>
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