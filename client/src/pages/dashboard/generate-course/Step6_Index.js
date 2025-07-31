// client/src/pages/dashboard/generate-course/Step6_Index.js
import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    StepContentContainer,
    StepHeader,
    StepTitle,
    StepDescription,
    NavigationButtons,
    NavButton,
    IndexContainer
} from './GenerateCourse.styles';
import { Modal, ModalText, ModalButtonContainer, ModalButton } from '../../../components/common/Modal';
import { useTranslation } from 'react-i18next';

const SubtopicTitle = styled.h4`
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 0.5rem;
    margin-top: 1rem;
`;

const LessonList = styled.ul`
    list-style-position: inside;
    padding-left: 1rem;
    padding-right: ${({ dir }) => (dir === 'rtl' ? '1rem' : '0')};
`;

const LessonItem = styled.li`
    margin-bottom: 0.5rem;
`;

const AddLessonForm = styled.div`
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #555;
`;

const FormRow = styled.div`
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-top: 1rem;
`;

const StyledSelect = styled.select`
    height: 40px;
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid #555;
    background-color: #33333d;
    color: white;
    flex-grow: 1;
`;

const StyledInput = styled.input`
    height: 40px;
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid #555;
    background-color: #33333d;
    color: white;
    flex-grow: 2;
`;

const AddButton = styled(NavButton)`
    padding: 0.5rem 1rem;
    height: 40px;
`;

const CustomLessonTag = styled.div`
    background-color: #555;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.8rem;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    display: inline-block;
`;

const SuggestionButton = styled(ModalButton)`
    width: 100%;
    margin-bottom: 0.75rem;
    text-align: center;
`;

const Step6_Index = ({ handleGenerateIndex, prevStep, updateCourseData, data, isLoading }) => {
    const navigate = useNavigate();
    const [regenerateCount, setRegenerateCount] = useState(1);
    const [newLesson, setNewLesson] = useState('');
    const [selectedSubtopic, setSelectedSubtopic] = useState(0);
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
    const [suggestionModal, setSuggestionModal] = useState({ isOpen: false, suggestions: [] });
    const [isRefining, setIsRefining] = useState(false);
    const { t } = useTranslation();

    const isRTL = ['ar', 'ur'].includes(data.language);
    const maxCustomLessons = data.numSubtopics === 1 ? 4 : data.numSubtopics;

    const triggerLessonRefinement = async () => {
        if (!newLesson.trim()) return;

        if (data.customLessons.length >= maxCustomLessons) {
            setErrorModal({ isOpen: true, message: t('course_generation.max_custom_lessons_error', { maxCustomLessons: maxCustomLessons }) });
            return;
        }
        const lessonsInSubtopic = data.customLessons.filter(l => l.subtopicIndex === selectedSubtopic).length;
        if (lessonsInSubtopic >= 2) {
            setErrorModal({ isOpen: true, message: t('course_generation.max_lessons_per_subtopic_error') });
            return;
        }

        setIsRefining(true);
        const token = localStorage.getItem('token');
        const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token }};
        const body = JSON.stringify({
            courseId: data.courseId, // Ensure courseId is passed for fetching English titles
            topic: data.topic,
            subtopicTitle: data.index.subtopics[selectedSubtopic].title,
            englishTopic: data.englishTopic, // Pass English topic
            englishSubtopicTitle: data.index.subtopics[selectedSubtopic].englishTitle, // Pass English subtopic title
            lessonInput: newLesson,
            languageName: data.languageName,
            nativeName: data.nativeName
        });
        
        try {
            const res = await axios.post('/api/course/refine-lesson', body, config);
            setSuggestionModal({ isOpen: true, suggestions: res.data.suggestions });
        } catch (error) {
            console.error("Refine Lesson Error:", error.response?.data || error.message);
            setErrorModal({ isOpen: true, message: t('course_generation.suggestions_error') });
        } finally {
            setIsRefining(false);
        }
    };

    const handleSuggestionSelect = (suggestion) => {
        const newCustomLesson = { title: suggestion.title, englishTitle: suggestion.englishTitle, subtopicIndex: selectedSubtopic }; // Use both titles
        updateCourseData({ customLessons: [...data.customLessons, newCustomLesson] });
        setNewLesson('');
        setSuggestionModal({ isOpen: false, suggestions: [] });
    };

    const handleRegenerateClick = () => {
        if (regenerateCount > 0) {
            setRegenerateCount(prev => prev - 1);
            handleGenerateIndex();
        } else {
            setErrorModal({ isOpen: true, message: t('errors.regeneration_limit_reached') });
        }
    };
    
    const handleGenerateCourse = () => {
        if (data.courseId && data.index && data.index.subtopics.length > 0 && data.index.subtopics[0].lessons.length > 0) {
            const firstSubtopicId = data.index.subtopics[0]._id;
            const firstLessonId = data.index.subtopics[0].lessons[0]._id;
            navigate(`/course/${data.courseId}/lesson/${firstSubtopicId}/${firstLessonId}`);
        } else {
            setErrorModal({isOpen: true, message: t('course_generation.course_data_missing_error')})
        }
    };

    return (
        <>
            <Modal isOpen={errorModal.isOpen} onClose={() => setErrorModal({ isOpen: false, message: '' })} title={t('course_generation.info_modal_title')}>
                <ModalText>{errorModal.message}</ModalText>
                <ModalButtonContainer>
                    <ModalButton primary onClick={() => setErrorModal({ isOpen: false, message: '' })}>{t('course_generation.ok_button')}</ModalButton>
                </ModalButtonContainer>
            </Modal>

            <Modal isOpen={suggestionModal.isOpen} onClose={() => setSuggestionModal({ isOpen: false, suggestions: [] })} title={t('course_generation.choose_lesson_title_modal')}>
                <ModalText>{t('course_generation.lesson_refinement_modal_text')}</ModalText>
                <ModalButtonContainer style={{ flexDirection: 'column', marginTop: '1.5rem' }}>
                    {suggestionModal.suggestions.map((suggestion, index) => (
                        <SuggestionButton key={index} onClick={() => handleSuggestionSelect(suggestion)}>
                            {/* Display both native and English titles */}
                            {suggestion.title} {suggestion.englishTitle && `(${suggestion.englishTitle})`}
                        </SuggestionButton>
                    ))}
                </ModalButtonContainer>
            </Modal>
        
            <StepContentContainer>
                <StepHeader>
                    <StepTitle>{t('course_generation.step6_title')}</StepTitle>
                    <StepDescription dangerouslySetInnerHTML={{ __html: t('course_generation.step6_description', { maxCustomLessons: maxCustomLessons }) }}></StepDescription>
                </StepHeader>

                <IndexContainer dir={isRTL ? 'rtl' : 'ltr'}>
                    {(isLoading && !data.index) && <p>{t('course_generation.syllabus_loading_message')}</p>}
                    {data.index && data.index.subtopics && data.index.subtopics.map((sub, index) => (
                        <div key={sub._id || index}>
                            <SubtopicTitle>
                                {/* Display native subtopic title with English in brackets */}
                                {index + 1}. {sub.title} {sub.englishTitle && `(${sub.englishTitle})`}
                            </SubtopicTitle>
                            <LessonList dir={isRTL ? 'rtl' : 'ltr'}>
                                {sub.lessons.map((lesson) => (
                                    <LessonItem key={lesson._id || lesson.title}>
                                        {/* Display native lesson title with English in brackets */}
                                        {lesson.title} {lesson.englishTitle && `(${lesson.englishTitle})`}
                                    </LessonItem>
                                ))}
                            </LessonList>
                        </div>
                    ))}
                </IndexContainer>
                
                <AddLessonForm>
                    <h5>{t('course_generation.add_custom_lesson_heading')}</h5>
                    <FormRow>
                        <StyledSelect value={selectedSubtopic} onChange={(e) => setSelectedSubtopic(parseInt(e.target.value, 10))}>
                            {data.index?.subtopics.map((sub, index) => (
                                <option key={sub._id || index} value={index}>
                                    {/* Display native subtopic title with English in brackets */}
                                    {t('subtopic_label', { defaultValue: 'Subtopic' })} {index + 1}: {sub.title.substring(0, 40)}... {sub.englishTitle && `(${sub.englishTitle.substring(0, 40)}...)`}
                                </option>
                            ))}
                        </StyledSelect>
                        <StyledInput
                            type="text"
                            placeholder={t('course_generation.enter_lesson_title_placeholder')}
                            value={newLesson}
                            onChange={(e) => setNewLesson(e.target.value)}
                        />
                        <AddButton primary onClick={triggerLessonRefinement} disabled={isRefining}>
                            {isRefining ? '...' : t('course_generation.add_button')}
                        </AddButton>
                    </FormRow>
                    <div style={{ marginTop: '1rem' }}>
                        {data.customLessons.map((lesson, i) => (
                            <CustomLessonTag key={i}>
                                {/* Display native custom lesson title with English in brackets */}
                                S{lesson.subtopicIndex + 1}: {lesson.title} {lesson.englishTitle && `(${lesson.englishTitle})`}
                            </CustomLessonTag>
                        ))}
                    </div>
                </AddLessonForm>

                <NavigationButtons>
                    <NavButton onClick={prevStep} disabled={isLoading}>{t('course_generation.back_button')}</NavButton>
                    <NavButton onClick={handleRegenerateClick} disabled={isLoading || regenerateCount === 0 || data.customLessons.length === 0}>
                        {t('course_generation.regenerate_index_button')} ({regenerateCount})
                    </NavButton>
                    <NavButton primary onClick={handleGenerateCourse} disabled={isLoading || !data.index}>
                        {t('course_generation.generate_course_button')}
                    </NavButton>
                </NavigationButtons>
            </StepContentContainer>
        </>
    );
};

export default Step6_Index;