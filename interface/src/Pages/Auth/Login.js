import "./Auth.css";
import React, { useState } from "react";

import { Link } from "react-router-dom"; // Import the Link component
import {
    getAuth,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
} from "firebase/auth";

const LoginPage = (
    { isDark, setIsDark } // Add the props here
) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errMsg, setErrMsg] = useState("");
    const [resetMsg, setResetMsg] = useState("");

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const validateEmail = (email) => {
        if (!email) {
            return "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            return "Email is invalid";
        } else {
            return "";
        }
    };

    const validatePassword = (password) => {
        if (!password) {
            return "Password is required";
        } else {
            return "";
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const auth = getAuth();

        let er = validateEmail(email);
        if (er) {
            setErrMsg(er);
            return;
        }
        er = validatePassword(password);
        if (er) {
            setErrMsg(er);
            return;
        }

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                user.getIdToken().then((idToken) => {
                    // Send idToken to backend for verification
                    console.log("idToken:", idToken);
                    fetch(
                        process.env.REACT_APP_BACKEND_URL + "/auth/verifyToken",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ token: idToken }),
                            credentials: "include",
                        }
                    )
                        .then((response) => response.json())
                        .then((data) => {
                            console.log("Success:", data);
                            fetch(
                                process.env.REACT_APP_BACKEND_URL +
                                    "/auth/test",
                                {
                                    method: "GET",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    credentials: "include",
                                }
                            )
                                .then((response) => response.json())
                                .then((data) => {
                                    console.log("Test Success:", data);
                                })
                                .catch((error) => {
                                    console.log("Test Error:", error);
                                });
                        })
                        .catch((error) => {
                            if (error.code === "auth/email-already-in-use") {
                                setErrMsg(
                                    "There is already an account with this email"
                                );
                                setErrMsg(error.code);
                            } else {
                                setErrMsg("Error logging in");
                            }
                        });
                });
            })
            .catch((error) => {
                console.log("Error logging in:", error.message);
                if (error.code === "auth/user-not-found") {
                    setErrMsg("User not found");
                } else if (error.code === "auth/wrong-password") {
                    setErrMsg("Wrong password");
                } else if (error.code === "auth/invalid-credential") {
                    setErrMsg("Invalid credentials!");
                } else if (error.code === "auth/email-already-in-use") {
                    setErrMsg("There is already an account with this email");
                } else {
                    setErrMsg("Error logging in");
                }
            });
    };

    const handlePasswordReset = () => {
        const auth = getAuth();
        const email = document.getElementById("resetEmail").value;
        sendPasswordResetEmail(auth, email)
            .then(() => {
                // Password reset email sent!
                // Show some confirmation to the user

                setResetMsg(
                    <p className="text-success text-sm">
                        Password reset email sent! Please check your email and
                        click the link to reset your password.
                    </p>
                );
            })
            .catch((error) => {
                // Handle Errors here.
                const errorCode = error.code;
                const errorMessage = error.message;
                // Show error message to your user
                if (errorCode === "auth/missing-email") {
                    setResetMsg(
                        <p className="text-error text-sm">
                            Email is required to reset password
                        </p>
                    );
                } else if (errorCode === "auth/invalid-email") {
                    setResetMsg(
                        <p className="text-error text-sm">
                            Invalid email address
                        </p>
                    );
                } else {
                    console.log(
                        "Error sending password reset email:",
                        errorMessage
                    );
                    setResetMsg(
                        <p className="text-error text-sm">
                            Error sending password reset email
                        </p>
                    );
                }
            });
    };

    return (
        <div className="h-full">
            <div className="form-container">
                {" "}
                <div className="card text-primary-content w-1/2 card-bordered">
                    <div className="card-body">
                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="flex justify-center items-center mb-2">
                                <input
                                    type="text"
                                    id="email"
                                    placeholder="Email"
                                    className="input input-bordered w-3/4 "
                                    value={email}
                                    onChange={handleEmailChange}
                                />
                            </div>
                            <div className="flex justify-center items-center mb-2">
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="Password"
                                    className="input input-bordered w-3/4 "
                                    value={password}
                                    onChange={handlePasswordChange}
                                />
                            </div>

                            <div className="flex justify-center items-center mt-4">
                                <button
                                    className="btn btn-primary w-3/4"
                                    type="submit"
                                >
                                    Log in
                                </button>
                            </div>

                            <div className="flex justify-center items-center mt-6">
                                <h4
                                    className="link link-primary"
                                    onClick={() => {
                                        setResetMsg("");
                                        document
                                            .getElementById("reset_pass_modal")
                                            .showModal();
                                    }}
                                >
                                    {" "}
                                    {/* Add the Link component */}
                                    Forgot your password?
                                </h4>
                            </div>
                            <div className="flex justify-center items-center mt-4">
                                <p className="text-error text-sm w-1/4 text-center">
                                    {errMsg}
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
                <div className="card text-primary-content w-1/2 card-bordered mt-10">
                    <div className="card-body">
                        <p className="flex justify-center items-center">
                            Don't have an account?
                            <Link
                                to="/signup"
                                className="link link-primary ml-5"
                            >
                                {" "}
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <dialog id="reset_pass_modal" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">Reset Password</h3>
                    <p>
                        Please enter your email to receive a password reset
                        link.
                    </p>
                    <input
                        type="email"
                        id="resetEmail"
                        placeholder="Email"
                        className="input input-bordered w-full mt-2"
                    />
                    <div className="modal-action flex flex-row justify-center items-center">
                        <button
                            onClick={handlePasswordReset}
                            className="btn btn-primary"
                        >
                            Send Reset Link
                        </button>
                    </div>
                    <div className=" flex flex-row justify-center items-center mt-5">
                        {resetMsg}
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    );
};

export default LoginPage;
