import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    updateUser,
    changePassword,
    deleteAccount,
    deleteProfilePicture,
    getApiAssetUrl,
    getCurrentUser,
    uploadProfilePicture,
} from "../services/api";

import "../css/Profile.css";


function Profile() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [username, setUsername] = useState("");
    const [usernameLoading, setUsernameLoading] = useState(false);

    const [usernameError, setUsernameError] = useState("");
    const [usernameMessage, setUsernameMessage] = useState("");

    const [selectedFile, setSelectedFile] =
        useState(null);

    const [pictureLoading, setPictureLoading] =
        useState(false);

    const [pictureError, setPictureError] =
        useState("");

    const [pictureMessage, setPictureMessage] =
        useState("");

    const [currentPassword, setCurrentPassword] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [passwordLoading, setPasswordLoading] =
        useState(false);

    const [passwordError, setPasswordError] =
        useState("");

    const [passwordMessage, setPasswordMessage] =
        useState("");

    const [deleteConfirmation, setDeleteConfirmation] =
        useState("");

    const [deleteLoading, setDeleteLoading] =
        useState(false);

    const [deleteError, setDeleteError] =
        useState("");


    useEffect(() => {
        let cancelled = false;

        async function loadUser() {
            try {
                setLoading(true);

                const data = await getCurrentUser();

                if (!cancelled) {
                    setUser(data);
                    setUsername(data.username);
                }
            } catch (error) {
                if (cancelled) {
                    return;
                }

                if (error.status === 401) {
                    localStorage.removeItem("accessToken");
                    navigate("/login");
                    return;
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadUser();

        return () => {
            cancelled = true;
        };
    }, [navigate]);


    function handleFileSelection(event) {
        const file = event.target.files?.[0] || null;

        setSelectedFile(file);
        setPictureError("");
        setPictureMessage("");
    }


    async function handlePictureUpload(event) {
        event.preventDefault();

        if (!selectedFile || !user) {
            setPictureError("Please select an image first.");
            return;
        }

        try {
            setPictureLoading(true);
            setPictureError("");
            setPictureMessage("");

            const updatedUser =
                await uploadProfilePicture(user.id, selectedFile);

            setUser(updatedUser);
            window.dispatchEvent(new Event("profileUpdated")); // Η εικονα αλλαζει αμεσως μετα απο upload χωρις refresh
            setSelectedFile(null);

            setPictureMessage("Profile picture updated successfully.");

            event.target.reset();
        } catch (error) {
            if (error.status === 401) {
                localStorage.removeItem("accessToken");
                navigate("/login");
                return;
            }

            setPictureError(error.message || "Could not upload profile picture.");
        } finally {
            setPictureLoading(false);
        }
    }


    async function handlePictureDelete() {
        if (!user?.image_file) {
            return;
        }

        try {
            setPictureLoading(true);
            setPictureError("");
            setPictureMessage("");

            const updatedUser = await deleteProfilePicture(user.id);

            setUser(updatedUser);
            window.dispatchEvent(new Event("profileUpdated")); // Η εικονα αλλαζει αμεσως μετα την διαγραφη χωρις refresh

            setPictureMessage("Profile picture removed successfully.");
        } catch (error) {
            setPictureError(error.message || "Could not remove profile picture.");
        } finally {
            setPictureLoading(false);
        }
    }

    async function handleUsernameChange(event) {
        event.preventDefault();

        const cleanUsername = username.trim();

        setUsernameError("");
        setUsernameMessage("");

        if(!cleanUsername) {
            setUsernameError("Username cannot be empty.");
            return;
        }

        try{
            setUsernameLoading(true);
            
            const updatedUser = await updateUser(user.id, {
                username: cleanUsername,
            });

            setUser(updatedUser);
            setUsername(updatedUser.username);

            setUsernameMessage("Username updated successfully.");
        } catch (error) {
            if (error.status === 401){
                localStorage.removeItem("accessToken");
                navigate("/login");
                return;
            }

            setUsernameError(error.message || "Could not update your username.");
        } finally {
            setUsernameLoading(false);
        }
    }

    async function handlePasswordChange(event) {
        event.preventDefault();

        setPasswordError("");
        setPasswordMessage("");

        if (newPassword.length < 8) {
            setPasswordError("The new password must contain at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("The new passwords do not match.");
            return;
        }

        if (currentPassword === newPassword) {
            setPasswordError("The new password must be different from the current password.");
            return;
        }

        try {
            setPasswordLoading(true);

            const data = await changePassword(currentPassword, newPassword);

            setPasswordMessage(data.message || "Password changed successfully.");

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            setPasswordError(error.message || "Could not change your password.");
        } finally {
            setPasswordLoading(false);
        }
    }


    async function handleAccountDelete() {
        if (!user || deleteConfirmation !== "DELETE") {
            return;
        }

        try {
            setDeleteLoading(true);
            setDeleteError("");

            await deleteAccount(user.id);

            localStorage.removeItem("accessToken");

            navigate("/");
        } catch (error) {
            setDeleteError(error.message || "Could not delete your account.");

            setDeleteLoading(false);
        }
    }


    if (loading) {
        return (
            <main className="profile-page">
                <p className="profile-status">
                    Loading your profile...
                </p>
            </main>
        );
    }


    if (!user) {
        return (
            <main className="profile-page">
                <p className="profile-error">
                    Could not load your profile.
                </p>
            </main>
        );
    }


    const profileImageUrl =
        getApiAssetUrl(user.image_path);


    return (
        <main className="profile-page">
            <header className="profile-header">
                <h1>My Profile</h1>

                <p>
                    Manage your profile and account settings.
                </p>
            </header>


            <section className="profile-section">
                <h2>Profile Picture</h2>

                <div className="profile-picture-layout">
                    <img
                        className="profile-picture"
                        src={profileImageUrl}
                        alt={`${user.username} profile`}
                    />

                    <div className="profile-picture-controls">
                        <p className="profile-username">
                            {user.username}
                        </p>

                        <p className="profile-email">
                            {user.email}
                        </p>

                        <form className="profile-picture-form" onSubmit={handlePictureUpload}>
                            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileSelection} />

                            {selectedFile && (
                                <p className="profile-selected-file">
                                    Selected: {selectedFile.name}
                                </p>
                            )}

                            <div className="profile-actions">
                                <button
                                    type="submit"
                                    className="profile-primary-button"
                                    disabled={pictureLoading || !selectedFile}
                                >
                                    {pictureLoading
                                        ? "Uploading..."
                                        : "Upload picture"}
                                </button>

                                {user.image_file && (
                                    <button
                                        type="button"
                                        className="profile-secondary-button"
                                        onClick={handlePictureDelete}
                                        disabled={pictureLoading}
                                    >
                                        Remove picture
                                    </button>
                                )}
                            </div>
                        </form>

                        {pictureError && (
                            <p className="profile-error">
                                {pictureError}
                            </p>
                        )}

                        {pictureMessage && (
                            <p className="profile-success">
                                {pictureMessage}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <section className="profile-section">
                <h2>Change Username</h2>

                <form className="profile-form" onSubmit={handleUsernameChange}>
                    <div className="profile-field">
                        <label htmlFor="profile-username">
                            Username
                        </label>

                        <input
                            id="profile-username"
                            type="text"
                            required
                            minLength={1}
                            maxLength={50}
                            autoComplete="username"
                            value={username}
                            onChange={(event) => {
                                setUsername(event.target.value);
                                setUsernameError("");
                                setUsernameMessage("");
                            }}
                        />
                    </div>

                    {usernameError && ( <p className="profile-error">{usernameError}</p>) }

                    {usernameMessage && ( <p className="profile-success">{usernameMessage}</p> )}

                    <button
                        type="submit"
                        className="profile-primary-button"
                        disabled={
                            usernameLoading ||
                            username.trim() === user.username
                        }
                    >
                        {usernameLoading
                            ? "Saving..."
                            : "Update username"}
                    </button>
                </form>
            </section>

            <section className="profile-section">
                <h2>Change Password</h2>

                <form className="profile-form" onSubmit={handlePasswordChange}>
                    <div className="profile-field">
                        <label htmlFor="current-password">
                            Current password
                        </label>

                        <input
                            id="current-password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={currentPassword}
                            onChange={(event) =>
                                setCurrentPassword(event.target.value)
                            }
                        />
                    </div>

                    <div className="profile-field">
                        <label htmlFor="profile-new-password">
                            New password
                        </label>

                        <input
                            id="profile-new-password"
                            type="password"
                            required
                            minLength={8}
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(event) =>
                                setNewPassword(event.target.value)
                            }
                        />
                    </div>

                    <div className="profile-field">
                        <label htmlFor="confirm-new-password">
                            Confirm new password
                        </label>

                        <input
                            id="confirm-new-password"
                            type="password"
                            required
                            minLength={8}
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                        />
                    </div>

                    {passwordError && (
                        <p className="profile-error">
                            {passwordError}
                        </p>
                    )}

                    {passwordMessage && (
                        <p className="profile-success">
                            {passwordMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="profile-primary-button"
                        disabled={passwordLoading}
                    >
                        {passwordLoading
                            ? "Changing..."
                            : "Change password"}
                    </button>
                </form>
            </section>


            <section className="profile-section profile-danger-zone">
                <h2>Delete Account</h2>

                <p>
                    This action permanently deletes your account,
                    preferences and saved library.
                </p>

                <div className="profile-field">
                    <label htmlFor="delete-confirmation">
                        Type DELETE to confirm
                    </label>

                    <input
                        id="delete-confirmation"
                        type="text"
                        value={deleteConfirmation}
                        onChange={(event) =>
                            setDeleteConfirmation(event.target.value)
                        }
                    />
                </div>

                {deleteError && (
                    <p className="profile-error">
                        {deleteError}
                    </p>
                )}

                <button
                    type="button"
                    className="profile-delete-button"
                    onClick={handleAccountDelete}
                    disabled={deleteLoading || deleteConfirmation !== "DELETE"}
                >
                    {deleteLoading
                        ? "Deleting account..."
                        : "Delete my account"}
                </button>
            </section>
        </main>
    );
}


export default Profile;