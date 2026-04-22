import { createContext, useContext, useState, useEffect } from "react";
import useAuth from "../hooks/useAuth";

const StudentContext = createContext();

// for parent view - parent can change the student they want to view. the student with name which is alphabetically first is being provided prior to action from the user's side

export function StudentProvider({ children }) {
    // Access the authenticated user from the AuthContext
    const { user } = useAuth();
    // Determine if the current user has the PARENT role to enable student-specific logic
    const isParent = user?.role === "PARENT";

    // State for the list of students linked to the parent
    const [students, setStudents] = useState([]);
    // State for the currently active student profile being viewed
    const [selectedStudent, setSelectedStudent] = useState(null);

    useEffect(() => {
        // If the user is not a parent, clear student data and abort the fetch
        if (!isParent) {
            setStudents([]);
            setSelectedStudent(null);
            return;
        }

        // Fetch the parent's children from the backend
        async function load() {
            const res = await fetch("/parent/students", { credentials: "include" });
            const data = await res.json();

            // If students are found, sort them alphabetically and set the first one as default
            if (Array.isArray(data) && data.length > 0) {
                const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
                setStudents(sorted);
                setSelectedStudent(sorted[0]);
            }
        }

        load();
    }, [isParent]);

    // Provide the student-related state and utilities to the component tree
    return (
        <StudentContext.Provider 
            value={{ students, selectedStudent, setSelectedStudent, isParent }}
        >
            {children}
        </StudentContext.Provider>
    );
}

// Custom hook to access the student's profile and enrollment data from the global context
export function useStudent() {
    // Retrieve the current student context, providing access to student-specific state and methods
    return useContext(StudentContext);
}

