import { useState } from "react";
import { FaEye, FaEyeSlash} from "react-icons/fa";

import "../css/PasswordInputIcon.css";

function PasswordInputIcon({
    id, value, onChange, placeholder="", autoComplete = "new-password", required = true, minLength, disabled = false,
}) {

    const [isVisible, setIsVisible] = useState(false);

    function handleVisibilityToggle() {
        setIsVisible((previousValue) => !previousValue);
    }

    return(
        <div className="password-input-container">
            <input 
                id={id}
                type={isVisible ? "text" : "password"}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                required={required}
                minLength={minLength}
                disabled={disabled}
            />

            <button
                type="button"
                className="password-input-toggle"
                onClick={handleVisibilityToggle}
                aria-label={isVisible ? "Hide password" : "Show password"}
                aria-pressed={isVisible}
            >
                {isVisible ? <FaEye/> : <FaEyeSlash/>}

            </button>
            
        </div>
    );
 
}    

export default PasswordInputIcon;