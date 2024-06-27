import React, { useReducer, useRef, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import '../App.css';  // Make sure this import statement is present
import { Bars } from 'react-loader-spinner';

export interface Book {
  id: number;
  title: string;
  author: string;
  year: number;
}

export type Action =
  | { type: 'SET_INITIAL_STATE'; payload: Book[] }
  | { type: 'ADD_BOOK'; payload: Book }
  | { type: 'UPDATE_BOOK'; payload: Book }
  | { type: 'DELETE_BOOK'; payload: number };

const bookReducer = (state: Book[], action: Action): Book[] => {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
      return action.payload;
    case 'ADD_BOOK':
      return [...state, action.payload];
    case 'UPDATE_BOOK':
      return state.map(book => (book.id === action.payload.id ? action.payload : book));
    case 'DELETE_BOOK':
      return state.filter(book => book.id !== action.payload);
    default:
      return state;
  }
};

const BookRepository: React.FC = () => {
  const [books, dispatch] = useReducer(bookReducer, []);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoadingFetch(true);
    try {
      const response = await axios.get<Book[]>('https://hono-bookstore-api.onrender.com/api/books');
      const booksData = response.data.map(book => ({ ...book, id: Number(book.id) }));
      dispatch({ type: 'SET_INITIAL_STATE', payload: booksData });
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoadingFetch(false);
    }
  };

  const handleAddBook = async () => {
    if (titleRef.current && authorRef.current && yearRef.current) {
      const title = titleRef.current.value.trim();
      const author = authorRef.current.value.trim();
      const year = parseInt(yearRef.current.value, 10);

      if (!title || !author || isNaN(year)) {
        alert("All fields must be filled out correctly.");
        return;
      }

      setLoadingSubmit(true);
      try {
        const newBook: Omit<Book, 'id'> = {
          title,
          author,
          year,
        };

        const response = await axios.post<Book>('https://hono-bookstore-api.onrender.com/api/books', newBook, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 201) {
          fetchBooks();
          setShowForm(false);
          setSuccessMessage('Book added successfully!');
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          console.error('Failed to add book:', response.statusText);
        }
      } catch (error) {
        console.error('Error saving book:', error);
      } finally {
        setLoadingSubmit(false);
      }

      titleRef.current.value = '';
      authorRef.current.value = '';
      yearRef.current.value = '';
    }
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setShowForm(true);
    if (titleRef.current && authorRef.current && yearRef.current) {
      titleRef.current.value = book.title;
      authorRef.current.value = book.author;
      yearRef.current.value = book.year.toString();
    }
  };

  const handleUpdateBook = async () => {
    if (!editingBook) return;

    if (titleRef.current && authorRef.current && yearRef.current) {
      const title = titleRef.current.value.trim();
      const author = authorRef.current.value.trim();
      const year = parseInt(yearRef.current.value, 10);

      if (!title || !author || isNaN(year)) {
        alert("All fields must be filled out correctly.");
        return;
      }

      setLoadingSubmit(true);
      try {
        const updatedBook: Book = {
          ...editingBook,
          title,
          author,
          year,
        };

        await axios.put<Book>(`https://hono-bookstore-api.onrender.com/api/books/${editingBook.id}`, updatedBook, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        fetchBooks();
        setEditingBook(null);
        setShowForm(false);
        setSuccessMessage('Book updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error('Error updating book:', error);
      } finally {
        setLoadingSubmit(false);
      }

      titleRef.current.value = '';
      authorRef.current.value = '';
      yearRef.current.value = '';
    }
  };

  const handleDeleteBook = async (id: number) => {
    setLoadingSubmit(true);
    try {
      const response = await axios.delete(`https://hono-bookstore-api.onrender.com/api/books/${id}`);

      if (response.status === 200) {
        fetchBooks();
        setSuccessMessage('Book deleted successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        console.error('Failed to delete book:', response.statusText);
      }
      fetchBooks();
        setSuccessMessage('Book deleted successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting book:', error);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const filteredBooks = books.filter((book: Book) => book.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const booksPerPage = 5;
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  const displayedBooks = filteredBooks.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  }, [currentPage, totalPages]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  }, [currentPage]);

  return (
    <div className="container">
      <h1>Book Repository</h1>
      {successMessage && <div className="success-message">{successMessage}</div>}
      <button onClick={() => {
        setShowForm(!showForm);
        if (!showForm) {
          setEditingBook(null);
        }
      }}>
        {showForm ? 'Cancel' : 'Add Book'}
      </button>
      {showForm && (
        <form>
          <input type="text" placeholder="Title" ref={titleRef} />
          <input type="text" placeholder="Author" ref={authorRef} />
          <input type="number" placeholder="Year" ref={yearRef} />
          <button type="button" onClick={editingBook ? handleUpdateBook : handleAddBook}>
            {editingBook ? 'Update Book' : 'Add Book'}
          </button>
        </form>
      )}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by title"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      {loadingFetch ? (
        <div className="spinner-container">
          <Bars
            height="80"
            width="80"
            color="#4fa94d"
            ariaLabel="bars-loading"
            wrapperStyle={{}}
            wrapperClass=""
            visible={true}
          />
          <p>Loading books...</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Year</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedBooks.map((book: Book) => (
              <tr key={book.id}>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.year}</td>
                <td>
                  <button className="edit-button" onClick={() => handleEditBook(book)}>Edit</button>
                  <button className="delete-button" onClick={() =>handleDeleteBook(book.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="pagination">
        <button onClick={handlePreviousPage} disabled={currentPage === 1}>Previous</button>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
      </div>
      {loadingSubmit && (
        <div className="spinner-container">
          <Bars
            height="80"
            width="80"
            color="#4fa94d"
            ariaLabel="bars-loading"
            wrapperStyle={{}}
            wrapperClass=""
            visible={true}
          />
          <p>Processing...</p>
        </div>
      )}
    </div>
  );
};

export default BookRepository;
