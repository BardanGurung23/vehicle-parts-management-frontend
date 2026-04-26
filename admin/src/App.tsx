import { SubmitHandler, useForm } from "react-hook-form";
import "./App.css";
import Input from "./components/Input";
import Button from "./components/Button";
import { RiLoginBoxLine } from "react-icons/ri";
import { useLoginMutation } from "./redux/services/authentication";
import { handleError } from "./utils/responseHandler";
import { useNavigate } from "react-router-dom";
import { deleteToken, getToken, setToken } from "./utils/tokenHandler";
import { useEffect } from "react";
import Toast from "./components/Toast";
import { useDispatch } from "react-redux";
import { setAuthData } from "./redux/feature/authSlice";
import Logo from "./assets/logo.svg";
import { jwtDecode } from "jwt-decode";
import { clearProfile } from "./redux/feature/profileSlice";
import { trimFormData } from "./utils/validationHelper";
import { PROJECT_NAME } from "./constants/projectConstants";

interface FormValues {
  email: string;
  password: string;
}

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

export default function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login] = useLoginMutation();

  useEffect(() => {
    const token = getToken("token");
    setToken("lang", "en");
    if (token) {
      try {
        const decodedToken: DecodedToken = jwtDecode(token);
        if (decodedToken?.exp * 1000 > Date.now()) {
          navigate("/admin/dashboard");
        } else {
          Toast("Session Expired. Please login again.", "error");
          dispatch(clearProfile());
          deleteToken("token");
          navigate("/");
        }
      } catch {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      const trimmedData = trimFormData(data);
      const response = await login(trimmedData).unwrap();
      const token = response.token ?? response.data?.token;
      setToken("token", token);
      dispatch(setAuthData({ ...response, token }));
      navigate("/admin/dashboard");
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <main>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="auth-form-wrapper">
          <img src={Logo} alt="Logo" className="auth-logo" />
          <h1>{PROJECT_NAME} Login</h1>
          <Input
            label="Email"
            placeholder="Enter your email"
            {...register("email", { required: "Email is Required" })}
            error={errors.email}
          />
          <Input
            label="Password"
            placeholder="Password"
            type="password"
            {...register("password", { required: "Password is Required" })}
            error={errors.password}
          />
          <Button type="submit" className="submit-button">
            <div className="flex justify-center items-center gap-[0.5rem] text-white">
              Login <RiLoginBoxLine />
            </div>
          </Button>
        </div>
      </form>
    </main>
  );
}
