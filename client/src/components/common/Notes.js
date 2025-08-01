// client/src/components/common/Notes.js
import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { FiFileText, FiX, FiSave } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Preloader from './Preloader';
import { useParams } from 'react-router-dom';

// Define dimensions for consistency
const iconSize = '60px'; 
const iconOffset = '20px'; 
const iconVerticalSpacing = '10px';

// The fixed icon that toggles the sticky note
const NotesButton = styled(motion.div)`
  position: fixed;
  // Position above the chatbot icon
  bottom: calc(${iconOffset} + ${iconSize} + ${iconVerticalSpacing}); 
  width: ${iconSize};
  height: ${iconSize};
  border-radius: 50%;
  background-color: #03d9c5; 
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.2);
  z-index: 999;
  
  // Position from the relevant viewport edge
  ${({ $isRTL, $fixedOffset }) => $isRTL ? css`
    left: ${$fixedOffset};
    right: unset;
  ` : css`
    right: ${$fixedOffset};
    left: unset;
  `}
`;

// NEW: The text bubble that appears above the icon
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
    bottom: 70px; // Positioned 70px above the bottom of the button's container
    z-index: 1000;
    
    // Position bubble horizontally centered over the 60px wide button
    ${({ $isRTL }) => $isRTL ? css`
        left: 50%;
        transform: translateX(-50%);
    ` : css`
        right: 50%;
        transform: translateX(50%);
    `}
`;

// The sticky note pop-up that appears when the button is clicked
const StickyNote = styled(motion.div)`
  position: fixed;
  width: 300px;
  min-height: 350px;
  background-color: #fcf8dc;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  z-index: 998;
  display: flex;
  flex-direction: column;

  // Position it next to the icon, adjusted for RTL
  ${({ $isRTL, $fixedOffset }) => $isRTL ? css`
    left: calc(${$fixedOffset} + ${iconSize} + ${iconOffset});
    right: unset;
  ` : css`
    right: calc(${$fixedOffset} + ${iconSize} + ${iconOffset});
    left: unset;
  `}
  bottom: calc(${iconOffset} + ${iconSize} + ${iconVerticalSpacing});
`;

const NoteHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #333;
`;

const NoteTextArea = styled.textarea`
  flex-grow: 1;
  padding: 1rem;
  border: none;
  outline: none;
  background: transparent;
  resize: none;
  font-family: 'Segoe UI', sans-serif;
  font-size: 1rem;
  line-height: 1.5;
  color: #333;
`;

const SaveButtonContainer = styled.div`
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #ccc;
`;

const SaveButton = styled.button`
  background-color: #03d9c5;
  color: #1e1e2d;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-weight: bold;
  cursor: pointer;
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
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border-radius: 12px;
`;

const Notes = ({ courseId, isRTL, fixedSideOffset = '20px' }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [originalNotes, setOriginalNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchNotes = async () => {
            if (!courseId) {
                console.warn("[Notes] Cannot fetch notes: courseId is missing.");
                setIsLoading(false);
                setNotes('');
                setOriginalNotes('');
                return;
            }
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`/api/course/${courseId}`, {
                    headers: { 'x-auth-token': token },
                });
                setNotes(response.data.notes || '');
                setOriginalNotes(response.data.notes || '');
            } catch (err) {
                console.error('Error fetching notes:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchNotes();
        } else {
            setNotes(originalNotes);
        }
    }, [isOpen, courseId, originalNotes]);

    const handleSaveNotes = async () => {
        if (!courseId || notes === originalNotes) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/course/notes/${courseId}`, { notes }, {
                headers: { 'x-auth-token': token }
            });
            setOriginalNotes(notes);
        } catch (err) {
            console.error('Error saving notes:', err);
            alert(t('errors.save_notes_failed'));
        } finally {
            setIsSaving(false);
        }
    };

    const hasNotesChanged = notes !== originalNotes;

    return (
        <>
            {/* The NotesButton is now the container for both the icon and the text bubble */}
            <NotesButton
                onClick={() => setIsOpen(!isOpen)}
                $isRTL={isRTL}
                $fixedOffset={fixedSideOffset}
            >
                {/* The text bubble is rendered here */}
                <FixedNotesBubbleText $isRTL={isRTL}>
                    {t('notes.title', { defaultValue: 'Notes' })}
                </FixedNotesBubbleText>
                <FiFileText size={28} color="#1e1e2d" />
            </NotesButton>

            <AnimatePresence>
                {isOpen && (
                    <StickyNote
                        key="sticky-note"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        $isRTL={isRTL}
                        $fixedOffset={fixedSideOffset}
                    >
                        <NoteHeader>
                            <CloseButton onClick={() => setIsOpen(false)}><FiX /></CloseButton>
                        </NoteHeader>
                        {isLoading ? (
                            <PreloaderContainer style={{ backgroundColor: 'transparent' }}>
                                <Preloader />
                            </PreloaderContainer>
                        ) : (
                            <NoteTextArea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Type your notes here..."
                                dir={isRTL ? 'rtl' : 'ltr'}
                            />
                        )}
                        <SaveButtonContainer>
                            <SaveButton onClick={handleSaveNotes} disabled={isSaving || !hasNotesChanged || isLoading}>
                                {isSaving ? "Saving..." : "Save Notes"}
                            </SaveButton>
                        </SaveButtonContainer>
                    </StickyNote>
                )}
            </AnimatePresence>
        </>
    );
};

export default Notes;