import { useEffect, useState, useContext } from 'react';
import { Button, Dialog, DialogContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, Paper } from '@mui/material';
import { AuthContext } from './context/AuthContext';  // Make sure the path matches where the AuthContext is defined
import '../styles.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';


const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const { scopes, isAuthenticated } = useContext(AuthContext); // Use useContext to access the current authentication context

    // Function to fetch users
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://localhost:8000/users', {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            console.log(data)
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            const token = localStorage.getItem('token');
            console.log(userId, newRole)
            const response = await fetch(`https://localhost:8000/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ new_role: newRole }),
            });
            if (!response.ok) throw new Error('Failed to update role');

            // Refetch users to update the list with the new role
            await fetchUsers();
        } catch (error) {
            console.error('Failed to update user role', error);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://localhost:8000/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            if (!response.ok) throw new Error('Failed to delete user');

            // Refetch users to update the list after deletion
            await fetchUsers();
        } catch (error) {
            console.error('Failed to delete user', error);
        }
    };

    const handleClickOpen = () => {
        if (hasAdminScope) {
            setOpen(true);
        } else {
            alert('You do not have permission to manage users.');
        }
    };

    const handleClose = () => {
        setOpen(false);
    };

    const hasAdminScope = scopes.includes('admin');

    if (!hasAdminScope) {
        return <div></div>;
    }

    const theme = createTheme({
        palette: {
            primary: {
                main: '#000000', // Example primary color
            },
            secondary: {
                main: '#dc3545', // Example secondary color
            },
        },
    });

    return (
        <div>
            <ThemeProvider theme={theme}>
                <Button
                    className="manage-users-button"
                    variant="outlined"
                    onClick={handleClickOpen}
                >
                    Manage Users
                </Button>
                <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
                    <DialogContent>
                        <TableContainer component={Paper}>
                            <Table aria-label="users table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ID</TableCell>
                                        <TableCell>Username</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Full Name</TableCell>
                                        <TableCell align="right">Role</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell component="th" scope="row">
                                                {user.id}
                                            </TableCell>
                                            <TableCell>{user.username}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.full_name}</TableCell>
                                            <TableCell align="right">
                                                <Select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                >
                                                    <MenuItem value="admin">Admin</MenuItem>
                                                    <MenuItem value="noright">No Right</MenuItem>
                                                    <MenuItem value="read">Read</MenuItem>
                                                    <MenuItem value="read+write">Read and Write</MenuItem>
                                                </Select>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button 
                                                    className="export-button2"
                                                    variant="contained" 
                                                    color="secondary" 
                                                    onClick={() => handleDeleteUser(user.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </DialogContent>
                </Dialog>
            </ThemeProvider>
        </div>
    );
};

export default UsersPage;
