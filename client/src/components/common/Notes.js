// client/src/components/common/Notes.js
import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components'; // Import css
import { FiEdit3, FiX, FiSave, FiMinimize2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Preloader from './Preloader';
import { useParams } from 'react-router-dom'; // Import useParams to get lessonId

// Define fixed offsets
const chatbotIconHeight = '60px'; // Assuming chatbot icon is 60px height
const chatbotIconBottomOffset = '20px'; // From Chatbot.js
const notesIconVerticalSpacing = '10px'; // Space between notes icon and chatbot icon


const NotesBubble = styled(motion.div)`
  position: fixed;
  // Position above chatbot icon: chatbot's bottom (20px) + chatbot's height (60px) + spacing (10px)
  bottom: calc(${chatbotIconBottomOffset} + ${chatbotIconHeight} + ${notesIconVerticalSpacing}); 
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #33334f;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.2);
  z-index: 999; /* Slightly lower than chatbot */

  // Position based on fixedOffset (padding from edge of screen) and RTL
  ${({ $isRTL, $fixedOffset = '20px' }) => $isRTL ? css` /* ADDED DEFAULT VALUE HERE */
    left: ${$fixedOffset}; /* In RTL, icons are on the left, offset by fixedOffset */
    right: unset;
  ` : css`
    right: ${$fixedOffset}; /* In LTR, icons are on the right, offset by fixedOffset */
    left: unset;
  `}
`;

const NotesModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

const NotesModal = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background};
  border-radius: 12px;
  box-shadow: 0px 8px 30px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 600px;
  height: 80%;
  max-height: 700px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: fixed; /* Keep it fixed */
  bottom: ${chatbotIconBottomOffset}; /* Align with chatbot's bottom offset for consistency */

  // Position the modal mirroring Chatbot modal
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

const NotesHeader = styled.div`
  padding: 1rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.textSecondary};
  color: #1e1e2d;
  font-weight: bold;
  font-size: 1.1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
`;

const MinimizeButton = styled(CloseButton)`
    font-size: 1.2rem;
    margin-right: 10px;
`;


const NotesTextArea = styled.textarea`
  flex-grow: 1;
  padding: 1.5rem;
  font-size: 1rem;
  line-height: 1.6;
  border: none;
  outline: none;
  background-color: #2a2a3e;
  color: #fff;
  resize: vertical; /* Allow vertical resizing */
  font-family: 'Poppins', sans-serif;
`;

const SaveButtonContainer = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid #33334f;
  background-color: ${({ theme }) => theme.colors.background};
  display: flex;
  justify-content: flex-end;
`;

const SaveButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: #1e1e2d;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: #03c4b0;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PreloaderContainer = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border-radius: 12px;
`;

const FixedNotesBubbleText = styled.div`
    background-color: white;
    color: #333;
    padding: 0.3rem 0.8rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    font-size: 0.9rem;
    font-weight: 500;
    white-space: nowrap;
    position: absolute;
    bottom: 70px; /* Position above the icon (60px icon height + 10px spacing from icon top) */
    z-index: 1000; /* Ensure text bubble is above other elements */
    
    // Adjust position relative to the icon container.
    // Use transform to precisely center it horizontally above the 60px wide icon.
    ${({ $isRTL }) => $isRTL ? css`
        left: 50%;
        transform: translateX(-50%); /* Center the bubble above the icon in RTL */
    ` : css`
        right: 50%;
        transform: translateX(50%); /* Center the bubble above the icon in LTR */
    `}
`;


const Notes = ({ courseId, isRTL, fixedSideOffset = '20px' }) => {
    const { t } = useTranslation();
    const { lessonId } = useParams();

    const [isOpen, setIsOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [originalNotes, setOriginalNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true); 

    useEffect(() => {
        const fetchNotes = async () => {
            if (courseId && lessonId) {
                setIsLoading(true);
                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.get(`/api/notes/${courseId}/${lessonId}`, {
                        headers: { 'x-auth-token': token },
                    });
                    setNotes(response.data.notes || '');
                    setOriginalNotes(response.data.notes || '');
                } catch (err) {
                    console.error('Error fetching notes:', err);
                    setNotes('');
                    setOriginalNotes('');
                } finally {
                    setIsLoading(false);
                }
            }
        };
        if (isOpen && courseId && lessonId) {
            fetchNotes();
        } else if (!isOpen) {
            setNotes(originalNotes);
        }
    }, [isOpen, courseId, lessonId, originalNotes]);

    const handleSaveNotes = async () => {
        if (!courseId || !lessonId || notes === originalNotes) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `/api/notes/${courseId}/${lessonId}`,
                { notes },
                { headers: { 'x-auth-token': token } }
            );
            setOriginalNotes(notes);
        } catch (err) {
            console.error('Error saving notes:', err);
            alert(t(err.response?.data?.msgKey || 'errors.save_notes_failed', { defaultValue: 'Could not save notes. Please try again.' }));
        } finally {
            setIsSaving(false);
        }
    };

    const hasNotesChanged = notes !== originalNotes;

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <NotesBubble
                        onClick={() => setIsOpen(true)}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ type: 'spring', damping: 10, stiffness: 300 }}
                        $isRTL={isRTL} // Pass as transient prop
                        $fixedOffset={fixedSideOffset} // Pass fixedOffset
                    >
                        {/* Fixed text bubble for "Notes" */}
                        <FixedNotesBubbleText $isRTL={isRTL}>
                            {t('notes.title', { defaultValue: 'Notes' })}
                        </FixedNotesBubbleText>
                        <FiEdit3 size={28} color="#fff" />
                    </NotesBubble>
                )}

                {isOpen && (
                    <NotesModal
                        initial={{ opacity: 0, y: 50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.8 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        $isRTL={isRTL} // Pass as transient prop
                    >
                        <NotesHeader>
                            <span>{t('notes.title', { defaultValue: 'My Notes' })}</span>
                            <div>
                                <MinimizeButton onClick={() => setIsOpen(false)}>
                                    <FiMinimize2 />
                                </MinimizeButton>
                                <CloseButton onClick={() => setIsOpen(false)}>
                                    <FiX />
                                </CloseButton>
                            </div>
                        </NotesHeader>
                        {isLoading ? (
                            <PreloaderContainer>
                                <Preloader />
                            </PreloaderContainer>
                        ) : (
                            <NotesTextArea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={t('notes.placeholder', { defaultValue: 'Start typing your notes here...' })}
                                dir={isRTL ? 'rtl' : 'ltr'} // Set input direction
                            />
                        )}
                        <SaveButtonContainer>
                            <SaveButton onClick={handleSaveNotes} disabled={isSaving || !hasNotesChanged || isLoading}>
                                {isSaving ? t('notes.saving', { defaultValue: 'Saving...' }) : t('notes.save_button', { defaultValue: 'Save Notes' })}
                            </SaveButton>
                        </SaveButtonContainer>
                    </NotesModal>
                )}
            </AnimatePresence>
        </>
    );
};

export default Notes;