import { useEffect, useState, useContext } from 'react';
import { Button, Dialog, DialogContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, Paper } from '@mui/material';
import { AuthContext } from './context/AuthContext';  // Make sure the path matches where the AuthContext is defined
import '../styles.css';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const { scopes,isAuthenticated } = useContext(AuthContext); // Use useContext to access the current authentication context

    // Function to fetch users
    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:8000/users');
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
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
            const response = await fetch(`http://localhost:8000/users/${userId}/role`, {
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
    const hasEmployeeScope = scopes.includes('employee');

    {isAuthenticated && hasAdminScope && (
        <div>This is some admin-only content.</div>
    )}
    {isAuthenticated && hasEmployeeScope && (
        <div>This is some employee-only content.</div>
    )}
    if (!hasAdminScope) {
        return <div></div>;
    }

    return (
        <div>
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
                                        <TableCell align="right">{user.role}</TableCell>
                                        <TableCell align="right">
                                            <Select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            >
                                                <MenuItem value="basic">Basic</MenuItem>
                                                <MenuItem value="employee">Employee</MenuItem>
                                                <MenuItem value="admin">Admin</MenuItem>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UsersPage;
