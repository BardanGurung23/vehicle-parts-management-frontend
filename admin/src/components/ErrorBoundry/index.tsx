import { useNavigate } from "react-router-dom";
import image from "@/assets/oops-image.png";
export default function ErrorBoundary() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center mt-8 h-screen w-screen">
      <div className="w-[32%] flex flex-col gap-[0.5rem] items-center mb-[8rem]">
        <img src={image} alt="Page load failed" height="420" width="420" />
        <div className="font-bold text-primary mt-2">404 - PAGE NOT FOUND</div>
        <p className="text-center">
          {" "}
          The Page you are Looking for might have been removed, had its name
          changed or is temporarily unavailable
        </p>
        <button
          className="bg-[#1d4ed8] py-3 px-4 text-white-100 rounded-[2rem]"
          onClick={() => navigate("/admin/dashboard")}
        >
          Go To Homepage
        </button>
      </div>
    </div>
  );
}
