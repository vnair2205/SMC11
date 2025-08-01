// SMC3/client/src/pages/dashboard/MyCoursesPage.js
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns'; // CORRECTED: Changed from require() to import {} from ''
import { useTranslation } from 'react-i18next'; // CORRECTED: Changed from require() to import {} from ''
import { FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Preloader from '../../components/common/Preloader';

// --- Styled Components ---
const PageContainer = styled.div`
  padding: 2rem;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  min-height: calc(100vh - 100px); /* Adjust for header */
  display: flex;
  flex-direction: column;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const SearchFilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
`;

const InputGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #444;
  border-radius: 8px;
  background-color: #33333d;
  color: white;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 0.8rem;
  color: #a0a0a0;
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid #444;
  border-radius: 8px;
  background-color: #33333d;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  flex-grow: 1;
`;

const CourseCard = styled.div`
  background-color: #1e1e2d;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease-in-out;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
  }
`;

const CardThumbnail = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
  background-color: #33333d; /* Placeholder background */
`;

const CardContent = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const CardTitle = styled.h3`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;

const CardDetail = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 0.4rem;
`;

const CardStatus = styled.span`
  background-color: ${({ $status, theme }) => 
    $status === 'Completed' ? '#03a092' : '#888'};
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  align-self: flex-start;
  margin-top: auto; /* Pushes status to the bottom */
`;

const CardButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const CardButton = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  background-color: ${({ $primary, theme }) => ($primary ? theme.colors.primary : '#555')};
  color: ${({ $primary, theme }) => ($primary ? theme.colors.background : 'white')};
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
`;

const PaginationButton = styled.button`
  background-color: ${({ $active, theme }) => ($active ? theme.colors.primary : '#33333d')};
  color: ${({ $active, theme }) => ($active ? theme.colors.background : 'white')};
  border: 1px solid #444;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NoCoursesMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 3rem;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;


const MyCoursesPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination, Search & Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Active', 'Completed'
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const config = {
        headers: { 'x-auth-token': token },
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          sortBy: sortBy,
          status: statusFilter,
        },
      };

      const res = await axios.get('/api/course/', config);
      setCourses(res.data.docs);
      setTotalPages(res.data.totalPages);
      setTotalCourses(res.data.totalDocs);
    } catch (err) {
      console.error("Failed to fetch courses:", err.response ? err.response.data : err.message);
      setError(t(err.response?.data?.msgKey || 'errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, sortBy, statusFilter, navigate, t]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => { // Correctly named function
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleViewCourse = (course) => {
    const firstLessonId = course.index?.subtopics?.[0]?.lessons?.[0]?._id;
    
    console.log('--- Attempting direct navigation to lesson content ---');
    console.log('Course Object:', course);
    console.log('First Lesson ID:', firstLessonId);

    if (firstLessonId) {
        navigate(`/course/${course._id}/lesson/${firstLessonId}`);
    } else {
        alert("This course does not have any lessons yet!");
    }
  };

  const handleViewCertificate = (courseId) => {
    navigate(`/course/${courseId}/certificate`);
  };

  if (loading) {
    return <Preloader />;
  }

  return (
    <PageContainer>
      <HeaderContainer>
        <SearchFilterContainer>
          <InputGroup>
            <SearchInput
              type="text"
              placeholder={t('sidebar.search_course_by_topic')}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <SearchIcon />
          </InputGroup>
          <Select value={sortBy} onChange={handleSortChange}>
            <option value="newest">{t('sidebar.newest_to_oldest')}</option>
            <option value="oldest">{t('sidebar.oldest_to_newest')}</option>
          </Select>
          <Select value={statusFilter} onChange={handleStatusFilterChange}>
            <option value="all">{t('sidebar.all_status')}</option>
            <option value="Active">{t('sidebar.active_status')}</option>
            <option value="Completed">{t('sidebar.completed_status')}</option>
          </Select>
        </SearchFilterContainer>
        {/* Placeholder for other header elements if any */}
      </HeaderContainer>

      {error && <NoCoursesMessage style={{color: 'red'}}>{error}</NoCoursesMessage>}

      {totalCourses === 0 && !error ? (
        <NoCoursesMessage>{t('sidebar.no_courses_found')}</NoCoursesMessage>
      ) : (
        <CourseGrid>
          {courses.map((course) => (
            <CourseCard key={course._id}>
              <CardThumbnail src={course.thumbnailUrl || '/logo192.png'} alt={course.topic} />
              <CardContent>
                <CardTitle title={course.topic}>{course.topic}</CardTitle>
                <CardDetail>{t('sidebar.created_on')}: {format(new Date(course.createdAt), 'dd/MM/yyyy')}</CardDetail>
                <CardDetail>{t('sidebar.language')}: {course.languageName}</CardDetail>
                <CardDetail>{t('sidebar.subtopics')}: {course.numSubtopics}</CardDetail>
                <CardStatus $status={course.status}>{course.status}</CardStatus>
                <CardButtons>
                  <CardButton $primary onClick={() => handleViewCourse(course)}>
                    {t('sidebar.view_button')}
                  </CardButton>
                  {course.status === 'Completed' && (
                    <CardButton onClick={() => handleViewCertificate(course._id)}>
                      {t('sidebar.certificate_button')}
                    </CardButton>
                  )}
                </CardButtons>
              </CardContent>
            </CourseCard>
          ))}
        </CourseGrid>
      )}

      {totalCourses > 0 && (
        <PaginationContainer>
          <PaginationButton onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            <FiChevronLeft /> Previous
          </PaginationButton>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <PaginationButton
              key={pageNumber}
              onClick={() => handlePageChange(pageNumber)}
              $active={pageNumber === currentPage}
            >
              {pageNumber}
            </PaginationButton>
          ))}
          <PaginationButton onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Next <FiChevronRight />
          </PaginationButton>
          <Select value={itemsPerPage} onChange={handleItemsPerPageChange}>
            <option value="4">4 Per Page</option>
            <option value="8">8 Per Page</option>
            <option value="12">12 Per Page</option>
            <option value="20">20 Per Page</option>
          </Select>
        </PaginationContainer>
      )}
    </PageContainer>
  );
};

export default MyCoursesPage;