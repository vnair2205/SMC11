// SM10/client/src/components/layout/course/CourseLayout.js
import React from 'react';
import styled, { css } from 'styled-components';
import { useLocation } from 'react-router-dom';
import CourseSidebar from './CourseSidebar';
import Chatbot from '../../common/Chatbot';
import Notes from '../../common/Notes';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const courseSidebarWidth = '360px'; // Fixed width of your sidebar
const iconAreaWidth = '80px'; // Dedicated width for the icon "blank space" (adjust as needed)
const iconHorizontalPadding = '20px'; // Distance of the icon area from the content edge

const CourseLayoutContainer = styled.div`
    display: flex;
    height: 100vh;
    width: 100vw;
    overflow: hidden; // Prevents overall layout scrolling
    position: relative; // Needed for positioning MainContent absolutely
`;

// MainContent is now absolutely positioned to fit the available space
const MainContent = styled.div`
    position: absolute;
    top: 0;
    bottom: 0; // Spans full height
    display: flex;
    flex-direction: column;
    overflow-y: auto; // Content within this area can scroll
    background-color: ${({ theme }) => theme.colors.background};
    padding-top: 80px; /* Account for a global fixed header if present */
    padding-bottom: 20px; /* Add some bottom padding for scrollbar visibility */

    // Dynamically set left/right boundaries for MainContent itself
    ${({ $isRTL, $showSidebar }) => $isRTL ? css`
        // In RTL: Sidebar on the right, icons on the left.
        // MainContent starts from LEFT viewport edge, extends to RIGHT before sidebar.
        left: ${$showSidebar ? iconAreaWidth : '0px'}; // Adjust left to account for icon area
        right: ${$showSidebar ? courseSidebarWidth : '0px'}; // Adjust right to account for sidebar
    ` : css`
        // In LTR: Sidebar on the left, icons on the right.
        // MainContent starts after sidebar, extends to RIGHT before icon area.
        left: ${$showSidebar ? courseSidebarWidth : '0px'}; // Adjust left to account for sidebar
        right: ${$showSidebar ? iconAreaWidth : '0px'}; // Adjust right to account for icon area
    `}
    transition: left 0.3s ease-in-out, right 0.3s ease-in-out;
`;

const ContentInnerWrapper = styled.div`
    flex-grow: 1;
    padding: 20px; // Standard inner padding for the content
    position: relative; // Important for any absolutely positioned elements inside
    
    // Custom scrollbar styling (optional, but good for consistency)
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

    // The fixed offset for the icons from the *relevant viewport edge*.
    // This value is passed directly to Chatbot and Notes.
    const fixedIconOffset = iconHorizontalPadding;

    return (
        <CourseLayoutContainer dir={isRTL ? 'rtl' : 'ltr'}>
            {showSidebar && <CourseSidebar isRTL={isRTL} course={course} />}
            <MainContent $isRTL={isRTL} $showSidebar={showSidebar}>
                <ContentInnerWrapper>
                    {children}
                </ContentInnerWrapper>
            </MainContent>

            {/* Chatbot and Notes are fixed to the viewport. Their 'left'/'right' needs to be precise. */}
            <Chatbot
                isRTL={isRTL}
                course={course}
                courseCompletedAndPassed={courseCompletedAndPassed}
                // Pass the absolute offset from the relevant side, NOT including sidebar width
                fixedSideOffset={fixedIconOffset}
                sidebarPresent={showSidebar} // To know if sidebar is present for positioning
                iconAreaWidth={iconAreaWidth} // To know how much space to leave from edge
            />

            <Notes
                courseId={course?._id}
                isRTL={isRTL}
                fixedSideOffset={fixedIconOffset} // Pass a base offset from the edge of the content area
                sidebarPresent={showSidebar} // To know if sidebar is present for positioning
                iconAreaWidth={iconAreaWidth} // Pass icon area width
            />
        </CourseLayoutContainer>
    );
};

export default CourseLayout;