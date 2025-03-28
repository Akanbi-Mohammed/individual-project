import React, { useState, useEffect, useContext } from "react";
import {
    updatePassword,
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from "./fireBase";
import "./settings.css";
import { CurrencyContext } from "./CurrencyContext";
import NavBar from "./navbar";
import axios from "axios";
import Swal from "sweetalert2";
import Joyride, { STATUS } from "react-joyride";
import { FaQuestionCircle } from "react-icons/fa";


// -----------------------------
// Tutorial Steps for Settings
// -----------------------------
const settingsGuideSteps = [
    {
        target: ".settings-title",
        content:
            "Welcome to your Settings page! Here you can update personal details and preferences.",
    },
    {
        target: ".settings-section:nth-of-type(1)",
        content:
            "This section allows you to view and edit your first and last name. Click 'Edit' to begin.",
    },
    {
        target: ".settings-section:nth-of-type(2)",
        content:
            "This section shows your detected location and lets you set your preferred currency.",
    },
    {
        target: ".settings-section:nth-of-type(3)",
        content:
            "You can update your password here. For security, your current password is required.",
    },
    {
        target: ".settings-section:nth-of-type(4)",
        content:
            "Be careful! This section lets you permanently delete your account.",
    },
];

// Helper function to map currency codes to symbols
export const getCurrencySymbol = (currencyCode) => {
    const symbols = {
        USD: "$",
        EUR: "€",
        GBP: "£",
        NGN: "₦",
        GHS: "₵",
        CAD: "$",
        AUD: "$",
        INR: "₹",
        ZAR: "R",
        KES: "KSh",
        JPY: "¥",
        CNY: "¥",
        BRL: "R$",
        MXN: "$",
        AED: "د.إ",
    };
    return symbols[currencyCode] || currencyCode;
};

const Settings = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [location, setLocation] = useState("Unknown");
    const [stepIndex, setStepIndex] = useState(0);

    // We still use CurrencyContext, but won't store anything in local storage
    const { currency, setCurrency } = useContext(CurrencyContext);

    // Currency options for manual selection
    const currencyOptions = {
        GBP: "£ GBP",
        USD: "$ USD",
        EUR: "€ EUR",
        NGN: "₦ NGN",
        GHS: "₵ GHS",
        KES: "KSh KES",
        ZAR: "R ZAR",
        JPY: "¥ JPY",
        CNY: "¥ CNY",
        INR: "₹ INR",
        AED: "د.إ AED",
        BRL: "R$ BRL",
    };

    useEffect(() => {
        // If the user is logged in and has a displayName, split it into first/last
        if (auth.currentUser && auth.currentUser.displayName) {
            const names = auth.currentUser.displayName.split(" ");
            setFirstName(names[0] || "");
            setLastName(names.slice(1).join(" ") || "");
        }

        // Automatically fetch user location & currency from IP
        // No localStorage usage; we simply store in state
        fetchUserLocationAndCurrency();
    }, []);

    // Automatically fetch the user's location and currency using ipapi.co
    const fetchUserLocationAndCurrency = async () => {
        try {
            const response = await axios.get("https://ipapi.co/json/");
            const country = response.data.country_name || "Unknown";
            const currencyCode = response.data.currency || "USD"; // fallback to USD
            const currencySymbol = getCurrencySymbol(currencyCode);
            const detectedCurrency = currencyCode; // We'll store just the code, e.g. "GBP"

            setLocation(country);
            setCurrency(detectedCurrency);

            console.log("Location detected:", country);
            console.log("Currency detected:", detectedCurrency);
        } catch (error) {
            console.error("Error fetching user location:", error);
            setError("Unable to detect location. Please set currency manually.");
        }
    };

    const handleCurrencyChange = (e) => {
        const newCurrencyCode = e.target.value;
        if (!newCurrencyCode) {
            console.error("Invalid currency selected");
            return;
        }
        console.log("Currency selected:", newCurrencyCode);
        setCurrency(newCurrencyCode);

        Swal.fire({
            title: "✅ Currency Updated!",
            text: `Your preferred currency is now ${currencyOptions[newCurrencyCode]}.`,
            icon: "success",
            confirmButtonText: "OK",
        });
    };

    const clearMessages = () => {
        setTimeout(() => {
            setMessage("");
            setError("");
        }, 3000);
    };

    const handleSaveName = () => {
        setIsEditingName(false);

        Swal.fire({
            title: "✅ Name Updated!",
            text: "Your name has been successfully updated.",
            icon: "success",
            confirmButtonText: "OK",
        });
    };

    const handleChangePassword = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setError("No user is currently authenticated.");
                return;
            }

            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            // Reauthenticate using the current password for security
            await reauthenticateWithCredential(user, credential);
            // Update password with the new password provided
            await updatePassword(user, newPassword);
            setMessage("Password changed successfully!");
            setNewPassword("");
            Swal.fire({
                title: "✅ Password Changed!",
                text: "Your password has been successfully updated.",
                icon: "success",
                confirmButtonText: "OK",
            });
        } catch (err) {
            setError(err.message || "Failed to change password. Please try again.");
        } finally {
            clearMessages();
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setError("No user is currently authenticated.");
                return;
            }

            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            // Reauthenticate user before account deletion
            await reauthenticateWithCredential(user, credential);
            // Delete the user account
            await deleteUser(user);

            setMessage("Account deleted successfully.");
            // After account deletion, you might want to redirect or do something else
        } catch (err) {
            setError(err.message || "Failed to delete account. Please try again.");
        } finally {
            clearMessages();
            setShowDeleteModal(false);
        }
    };
    const [runGuide, setRunGuide] = useState(false);

    const handleJoyrideCallback = (data) => {
        const { status, type } = data;

        if ([STATUS.FINISHED].includes(status)) {
            setRunGuide(false);
            Swal.fire({
                title: "🎉 Tutorial Complete!",
                html: "<strong>That’s you done!</strong><br>Feel free to explore your settings.",
                icon: "success",
                confirmButtonText: "Awesome!",
                confirmButtonColor: "#28a745",
                backdrop: `
              rgba(0,0,123,0.4)
              url("https://i.gifer.com/7efs.gif")
              left top
              no-repeat
            `,
            });
            return;
        }

        if ([STATUS.SKIPPED].includes(status)) {
            setRunGuide(false);
            return;
        }

        if (type === "step:after" || type === "target:notFound") {
            setStepIndex((prev) => prev + 1);
        }
    };



    return (
        <>
            <NavBar/>
            <Joyride
                steps={settingsGuideSteps}
                run={runGuide}
                stepIndex={stepIndex}
                continuous
                showSkipButton
                disableBeacon
                callback={handleJoyrideCallback}
                styles={{ options: { zIndex: 10000 } }}
            />

            <div className="floating-help-button" onClick={() => {
                setStepIndex(0);
                setRunGuide(true);
            }}>
                <FaQuestionCircle className="help-icon"/>
            </div>

            <h2 className="settings-title">Settings</h2>
            <div className="settings-container">
                {/* Name Section */}
                <div className="settings-section">
                    <h3>Your Name</h3>
                    <p>Update your first and last name as they appear on your account.</p>
                    <div className="form-group">
                        <label>First Name</label>
                        {isEditingName ? (
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        ) : (
                            <p>{firstName}</p>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Last Name</label>
                        {isEditingName ? (
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        ) : (
                            <p>{lastName}</p>
                        )}
                    </div>
                    <button
                        className="primary-button"
                        onClick={() => (isEditingName ? handleSaveName() : setIsEditingName(true))}
                    >
                        {isEditingName ? "Save" : "Edit"}
                    </button>
                </div>

                {/* Currency & Location Section */}
                <div className="settings-section">
                    <h3>Currency & Location</h3>
                    <div className="form-group">
                        <label>Location</label>
                        <p>{location}</p>
                    </div>
                    <div className="form-group">
                        <label>Preferred Currency</label>
                        <select
                            value={currency}
                            onChange={handleCurrencyChange}
                            className="form-input"
                        >
                            {Object.entries(currencyOptions).map(([code, label]) => (
                                <option key={code} value={code}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Password Section */}
                <div className="settings-section">
                    <h3>Change Password</h3>
                    <p>
                        To change your password, please enter your current password and your
                        new desired password below. This helps ensure that your account
                        remains secure.
                    </p>
                    <div className="form-group">
                        <label>Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter your current password"
                        />
                    </div>
                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter your new password"
                        />
                    </div>
                    <button className="primary-button" onClick={handleChangePassword}>
                        Change Password
                    </button>
                    <p style={{fontSize: "0.9em", color: "#555"}}>
                        Note: Your current password is required to update your password.
                    </p>
                </div>

                {/* Delete Account Section */}
                <div className="settings-section">
                    <h3>Delete Account</h3>
                    <p>
                        Deleting your account is permanent and cannot be undone. To delete
                        your account, please ensure you have entered your current password
                        above. This step confirms your identity before account deletion.
                    </p>
                    <button className="danger-button" onClick={() => setShowDeleteModal(true)}>
                        Delete Account
                    </button>
                </div>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}

                {/* Delete Account Confirmation Modal */}
                {showDeleteModal && (
                    <div className="modal">
                        <div className="modal-content">
                            <h3>Are you sure?</h3>
                            <p>
                                Deleting your account is permanent and cannot be undone.
                                Please ensure you have entered your current password above.
                            </p>
                            <div className="modal-actions">
                                <button className="danger-button" onClick={handleDeleteAccount}>
                                    Yes, Delete
                                </button>
                                <button
                                    className="secondary-button"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Settings;
