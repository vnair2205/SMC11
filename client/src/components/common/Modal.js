import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
`;

const ModalContent = styled.div`
  background-color: #33333d;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  text-align: center;
`;

const ModalTitle = styled.h2`
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const ModalText = styled.p`
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  span {
    color: ${({ theme }) => theme.colors.white};
    font-weight: 500;
  }
`;

const ModalButtonContainer = styled.div`
  margin-top: 2rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`;

const ModalButton = styled.button`
  flex: 1;
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  background-color: ${({ primary, theme }) => (primary ? theme.colors.primary : '#555')};
  color: ${({ primary, theme }) => (primary ? theme.colors.background : 'white')};
`;

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalTitle>{title}</ModalTitle>
                {children}
            </ModalContent>
        </ModalOverlay>
    );
};

export { Modal, ModalText, ModalButtonContainer, ModalButton };