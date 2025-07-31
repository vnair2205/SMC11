import styled, { keyframes } from 'styled-components';

export const PageWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
`;

// --- Progress Bar Styles ---
export const ProgressBarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 3rem;
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 4px;
    background-color: #444;
    transform: translateY(-50%);
    z-index: 1;
  }
`;

export const ProgressStep = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  text-align: center;
  width: 150px;
`;

export const StepCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${({ active, theme }) => (active ? theme.colors.primary : '#444')};
  border: 4px solid #27293d; // Assuming #27293d is the main background of the layout
  color: ${({ active, theme }) => (active ? theme.colors.background : theme.colors.textSecondary)};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: background-color 0.3s ease;
`;

export const StepLabel = styled.span`
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: ${({ active, theme }) => (active ? theme.colors.text : theme.colors.textSecondary)};
  transition: color 0.3s ease;
`;


// --- Step Content Styles ---
export const StepContentContainer = styled.div`
  background-color: #1e1e2d; // Darker background for the content box
  padding: 2rem 3rem;
  border: 1px solid #444;
  border-radius: 12px;
  min-height: 450px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const StepHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

export const StepTitle = styled.h2`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.75rem;
`;

export const StepDescription = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

// --- Form Element Styles ---
export const InputWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 2rem auto 0;
`;

const typing = keyframes`
  from { width: 0; }
  to { width: 100%; }
`;

const blink = keyframes`
  50% { border-color: transparent; }
`;

export const AnimatedPlaceholder = styled.span`
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: #a0a0a0;
  pointer-events: none;
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid #a0a0a0;
  animation: 
    ${typing} 3s steps(30, end) infinite,
    ${blink} .75s step-end infinite;
`;

export const StyledInput = styled.input`
  width: 100%;
  height: 56px;
  padding: 1rem;
  font-size: 1.2rem;
  border-radius: 8px;
  border: 1px solid #555;
  background-color: #33333d;
  color: white;
  direction: ${({ dir }) => dir || 'ltr'};
  text-align: ${({ dir }) => (dir === 'rtl' ? 'right' : 'left')};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

export const StyledTextarea = styled.textarea`
  width: 100%;
  height: 250px;
  padding: 1rem;
  font-size: 1rem;
  border-radius: 8px;
  border: 1px solid #555;
  background-color: #33333d;
  color: white;
  resize: vertical;
  line-height: 1.6;
  direction: ${({ dir }) => dir || 'ltr'};
  text-align: ${({ dir }) => (dir === 'rtl' ? 'right' : 'left')};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

export const IndexContainer = styled.div`
    background-color: #33333d;
    border: 1px solid #555;
    border-radius: 8px;
    padding: 1.5rem;
    height: 300px;
    overflow-y: auto;
    direction: ${({ dir }) => dir || 'ltr'};
    text-align: ${({ dir }) => (dir === 'rtl' ? 'right' : 'left')};
`;


// --- Navigation Styles ---
export const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
`;

export const NavButton = styled.button`
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  background-color: ${({ primary, theme }) => (primary ? theme.colors.primary : '#555')};
  color: ${({ primary, theme }) => (primary ? theme.colors.background : 'white')};
  
  &:disabled {
    background-color: #444;
    color: #888;
    cursor: not-allowed;
  }
`;