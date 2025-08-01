// client/src/styles/LessonContentPage.styles
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const Container = styled.div`
    display: flex;
    flex-direction: row;
    padding: 2rem;
    color: white;
    background-color: ${({ theme }) => theme.colors.background};
    min-height: 100vh;
`;

export const ContentWrapper = styled.div`
    flex-grow: 1;
    max-width: 100%;
`;

export const LessonHeader = styled.div`
    margin-bottom: 2rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    padding-bottom: 1rem;
`;

export const LessonTitle = styled.h1`
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
`;

export const LessonDetails = styled.div`
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textSecondary};
`;

export const VideoContainer = styled.div`
    position: relative;
    width: 100%;
    /* 16:9 Aspect Ratio */
    padding-top: 56.25%;
    background-color: #000;
    margin-bottom: 2rem;
`;

export const VideoPlayer = styled.iframe`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
`;

export const PlaceholderMessage = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #222;
    color: #ccc;
    font-size: 1.2rem;
    text-align: center;
    padding: 1rem;
`;

export const LessonContentContainer = styled.div`
    line-height: 1.6;
    h1, h2, h3, h4, h5, h6 {
        color: ${({ theme }) => theme.colors.primary};
        margin-top: 1.5rem;
        margin-bottom: 0.5rem;
    }
    p {
        margin-bottom: 1rem;
    }
    ul, ol {
        margin-bottom: 1rem;
        padding-left: 1.5rem;
    }
    li {
        margin-bottom: 0.5rem;
    }
`;

export const NextLessonButton = styled.button`
    padding: 0.75rem 2rem;
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textPrimary};
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
        background-color: ${({ theme }) => theme.colors.primaryHover};
    }
`;
export const NotesWrapper = styled.div`
    position: fixed;
    right: 2rem;
    top: 100px;
    width: 300px;
    height: calc(100vh - 120px);
`;

export const LessonNotes = styled.div`
    background-color: ${({ theme }) => theme.colors.secondaryBackground};
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    height: 100%;
`;

export const NotesTitle = styled.h3`
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.2rem;
    color: ${({ theme }) => theme.colors.primary};
`;

export const NotesTextarea = styled.textarea`
    flex-grow: 1;
    background-color: #2a2a30;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 0.75rem;
    font-size: 1rem;
    color: white;
    resize: none;
    font-family: inherit;
    transition: border-color 0.3s;

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.primary};
    }
`;

export const SaveNotesButton = styled.button`
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textPrimary};
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
        background-color: ${({ theme }) => theme.colors.primaryHover};
    }

    &:disabled {
        background-color: #555;
        cursor: not-allowed;
    }
`;

export const NotesSavedMessage = styled.p`
    color: ${({ theme }) => theme.colors.success};
    text-align: center;
    font-size: 0.9rem;
    margin-top: 0.5rem;
    animation: ${fadeIn} 0.5s ease-out;
`;

export const NotesLoadingMessage = styled.p`
    color: ${({ theme }) => theme.colors.textSecondary};
    text-align: center;
    font-size: 0.9rem;
    margin-top: 0.5rem;
`;