import LOGO from "@/assets/logo.svg";

export default function Loader() {
  return (
    <div className="animate-pulse">
      <img src={LOGO} alt="Logo" />
    </div>
  );
}
