import "./Auth.css";
import React, { useState } from "react";

import { Link } from "react-router-dom";
import {
    getAuth,
    createUserWithEmailAndPassword,
} from "firebase/auth";

const SignupPage = ({ isDark, setIsDark }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errMsg, setErrMsg] = useState("");

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
        } else if (password.length < 6) {
            return "Password should be at least 6 charcters long";
        } else {
            return "";
        }
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        validateEmail(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        validatePassword(e.target.value);
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

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // User created
                // const user = userCredential.user;

                // sendEmailVerification(user).then(() => {
                //     // Email verification sent
                //     // Inform the user to check their email for verification
                //     setErrMsg(
                //         <div className="text-success">
                //             Verification email sent! Please check your email and
                //             click the link to verify your email.
                //             <p>
                //                 Didn't receive the email?{" "}
                //                 <Link
                //                     to="/verify-email"
                //                     className="link link-primary"
                //                 >
                //                     Resend
                //                 </Link>
                //             </p>
                //         </div>
                //     );
                // });
            })
            .catch((error) => {
                console.log("Error signing up:", error.code, error.message);

                if (error.code === "auth/email-already-in-use") {
                    setErrMsg("There is already an account with this email");
                } else {
                    setErrMsg("Error signing up");
                }
            });
    };

    return (
        <div className="h-full">
            <div className="form-container">
                <div className="card text-primary-content w-1/2 card-bordered">
                    <div className="card-body">
                        <form onSubmit={handleSubmit} className="signup-form">
                            <div className="flex justify-center items-center mb-2">
                                <input
                                    type="text"
                                    id="email"
                                    placeholder="Email"
                                    className="input input-bordered w-3/4"
                                    value={email}
                                    onChange={handleEmailChange}
                                />
                            </div>

                            <div className="flex justify-center items-center mb-2">
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="Password"
                                    className="input input-bordered w-3/4"
                                    value={password}
                                    onChange={handlePasswordChange}
                                />
                            </div>

                            <div className="flex justify-center items-center mt-4">
                                <button
                                    className="btn btn-primary w-3/4"
                                    type="submit"
                                >
                                    Sign Up
                                </button>
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
                            Have an account?
                            <Link
                                to="/login"
                                className="link link-primary ml-5"
                            >
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
