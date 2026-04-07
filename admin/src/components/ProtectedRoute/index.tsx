import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../redux/store/hooks";
import { useGetProfileQuery } from "@/redux/services/authentication";
import { useDispatch } from "react-redux";
import { clearProfile, setProfile } from "@/redux/feature/profileSlice";
import { deleteToken } from "@/utils/tokenHandler";

interface ProtectedRouteType {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteType> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useAppSelector((state) => state.auth.token);

  const {
    data: userProfile,
    isSuccess: success,
    error,
  } = useGetProfileQuery("");

  useEffect(() => {
    if (error && "status" in error) {
      const status = error.status;
      if (status === 401 || status === 403) {
        deleteToken("token");
        dispatch(clearProfile());
        navigate("/", { replace: true });
      }
    }
  }, [error]);

  useEffect(() => {
    if (userProfile && userProfile.data) {
      dispatch(setProfile(userProfile.data));
    }
  }, [userProfile, success]);

  if (!auth) {
    return <Navigate to="/" />;
  }
  return children;
};
