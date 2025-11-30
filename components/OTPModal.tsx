"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { verifySecret, sendEmailOTP } from "@/lib/actions/user.actions";
import { useRouter } from "next/navigation";

const OtpModal = ({
  accountId,
  email,
}: {
  accountId: string;
  email: string;
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSubmit = async (
    e?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    e?.preventDefault();

    if (isLoading || password.length !== 6) return;

    setIsLoading(true);

    console.log({ accountId, password });

    try {
      const sessionId = await verifySecret({ accountId, password });

      console.log({ sessionId });

      if (sessionId) {
        if (typeof window !== "undefined") {
          localStorage.setItem("loggedIn", "true");
        }
        router.push("/");
      }
    } catch (error) {
      console.log("Failed to verify OTP", error);
    }

    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setResendSuccess(false);
    
    try {
      await sendEmailOTP({ email });
      setResendSuccess(true);
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to resend OTP:", error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="shad-alert-dialog">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <AlertDialogHeader className="relative flex justify-center">
            <AlertDialogTitle className="h2 text-center">
              Enter Your OTP
              <Image
                src="/assets/icons/close-dark.svg"
                alt="close"
                width={20}
                height={20}
                onClick={() => setIsOpen(false)}
                className="otp-close-button"
              />
            </AlertDialogTitle>
            <AlertDialogDescription className="subtitle-2 text-center text-light-100">
              We&apos;ve sent a code to{" "}
              <span className="pl-1 text-brand">{email}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <InputOTP maxLength={6} value={password} onChange={setPassword}>
            <InputOTPGroup className="shad-otp">
              <InputOTPSlot index={0} className="shad-otp-slot" />
              <InputOTPSlot index={1} className="shad-otp-slot" />
              <InputOTPSlot index={2} className="shad-otp-slot" />
              <InputOTPSlot index={3} className="shad-otp-slot" />
              <InputOTPSlot index={4} className="shad-otp-slot" />
              <InputOTPSlot index={5} className="shad-otp-slot" />
            </InputOTPGroup>
          </InputOTP>

          <AlertDialogFooter>
            <div className="flex w-full flex-col gap-4">
              <AlertDialogAction
                onClick={handleSubmit}
                className="shad-submit-btn h-12"
                type="submit"
                disabled={isLoading || password.length !== 6}
              >
                Submit
                {isLoading && (
                  <Image
                    src="/assets/icons/loader.svg"
                    alt="loader"
                    width={24}
                    height={24}
                    className="ml-2 animate-spin"
                  />
                )}
              </AlertDialogAction>

              <div className="subtitle-2 mt-2 text-center text-light-100">
                Didn&apos;t get a code?
                <Button
                  type="button"
                  variant="link"
                  className={`pl-1 relative overflow-hidden transition-all duration-300 ${
                    isResending 
                      ? "text-blue-400 scale-95" 
                      : resendSuccess 
                      ? "text-green-500" 
                      : "text-brand hover:scale-105"
                  } ${!isResending && !resendSuccess ? "hover:bg-blue-50/10 rounded-lg px-2 py-1" : ""}`}
                  onClick={handleResendOtp}
                  disabled={isResending}
                >
                  <span className={`inline-flex items-center gap-2 ${isResending ? "animate-pulse" : ""}`}>
                    {isResending ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </>
                    ) : resendSuccess ? (
                      <>
                        <svg className="h-4 w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Code sent!
                      </>
                    ) : (
                      <>
                        <span className="relative">
                          Click to resend
                          {!isResending && !resendSuccess && (
                            <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 opacity-0 hover:opacity-100 transition-opacity duration-300 animate-shimmer" />
                          )}
                        </span>
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </div>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OtpModal;
