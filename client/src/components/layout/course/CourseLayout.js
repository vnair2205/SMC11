// client/src/components/layout/course/CourseLayout.js

import React from 'react';
import styled, { css } from 'styled-components';
import { useLocation } from 'react-router-dom';
import CourseSidebar from './CourseSidebar';
import Chatbot from '../../common/Chatbot';
import Notes from '../../common/Notes';
import { useTranslation } from 'react-i18next';

// Constants for layout dimensions
const expandedSidebarWidth = '300px'; // From Sidebar.js
const courseSidebarWidth = expandedSidebarWidth; // Assuming sidebar is expanded for course view
const fixedIconTotalWidth = '80px'; // Total space for fixed icons (60px icon + 20px padding)
const iconPaddingFromEdge = '20px'; // Padding of the icon from the viewport edge
const contentAreaPadding = '30px'; // NEW: General padding for the content area, adjust as needed

const CourseLayoutContainer = styled.div`
    display: flex;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    position: relative;
`;

const MainContent = styled.div`
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    background-color: ${({ theme }) => theme.colors.background};
    padding-top: 80px; /* Account for a global fixed header if present */
    padding-bottom: 20px; /* Add some bottom padding for scrollbar visibility */

    ${({ $isRTL, $showSidebar }) => $isRTL ? css`
        // In RTL: Sidebar on the right, icons on the left.
        // Content needs padding on the right for the sidebar, and padding on the left for the icons.
        padding-right: calc(${courseSidebarWidth} + ${contentAreaPadding}); // Added contentAreaPadding
        padding-left: calc(${fixedIconTotalWidth} + ${contentAreaPadding}); // Added contentAreaPadding
    ` : css`
        // In LTR: Sidebar on the left, icons on the right.
        // Content needs padding on the left for the sidebar, and padding on the right for the icons.
        padding-left: calc(${courseSidebarWidth} + ${contentAreaPadding}); // Added contentAreaPadding
        padding-right: calc(${fixedIconTotalWidth} + ${contentAreaPadding}); // Added contentAreaPadding
    `}

    transition: padding-left 0.3s ease-in-out, padding-right 0.3s ease-in-out;

    position: relative;
    top: auto;
    bottom: auto;
    left: auto;
    right: auto;
    width: auto;
`;

const ContentInnerWrapper = styled.div`
    flex-grow: 1;
    padding: 0; // Keep this at 0 as MainContent manages its own horizontal padding
    position: relative;

    &::-webkit-scrollbar {
        width: 8px;
    }
    &::-webkit-scrollbar-track {
        background: #2a2a3e;
    }
    &::-webkit-scrollbar-thumb {
        background: #555;
        border-radius: 4px;
    }
    &::-webkit-scrollbar-thumb:hover {
        background: #777;
    }
`;

const CourseLayout = ({ children, course, courseCompletedAndPassed }) => {
    const location = useLocation();
    const { i18n } = useTranslation();
    const isRTL = ['ar', 'ur'].includes(i18n.language);

    const hideSidebarPaths = ['/course/quiz', '/dashboard/scorecard'];
    const showSidebar = !hideSidebarPaths.some(path => location.pathname.includes(path));

    return (
        <CourseLayoutContainer dir={isRTL ? 'rtl' : 'ltr'}>
            {showSidebar && <CourseSidebar isRTL={isRTL} course={course} />}

            <MainContent $isRTL={isRTL} $showSidebar={showSidebar}>
                <ContentInnerWrapper>
                    {children}
                </ContentInnerWrapper>
            </MainContent>

            <Chatbot
                isRTL={isRTL}
                course={course}
                courseCompletedAndPassed={courseCompletedAndPassed}
                fixedSideOffset={iconPaddingFromEdge}
            />

            <Notes
                courseId={course?._id}
                isRTL={isRTL}
                fixedSideOffset={iconPaddingFromEdge}
            />
        </CourseLayoutContainer>
    );
};

export default CourseLayout;