import React from "react";

interface ManageStudentsIconProps {
    isActive: boolean;
}

const ManageStudentsIcon: React.FC<ManageStudentsIconProps> = ({ isActive }) => {
    return (
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill={isActive? "currentColor" : "#6B7280"} d="M16 13.5C16 14.8261 16.5268 16.0979 17.4645 17.0355C18.4021 17.9732 19.6739 18.5 21 18.5C22.3261 18.5 23.5979 17.9732 24.5355 17.0355C25.4732 16.0979 26 14.8261 26 13.5C26 12.1739 25.4732 10.9021 24.5355 9.96447C23.5979 9.02678 22.3261 8.5 21 8.5C19.6739 8.5 18.4021 9.02678 17.4645 9.96447C16.5268 10.9021 16 12.1739 16 13.5Z" stroke="#12293A" stroke-width="1.5" />
            <path d="M28.5 17.25C30.5711 17.25 32.25 15.8509 32.25 14.125C32.25 12.3991 30.5711 11 28.5 11" stroke="#12293A" stroke-width="1.5" stroke-linecap="round" />
            <path d="M13.5 17.25C11.4289 17.25 9.75 15.8509 9.75 14.125C9.75 12.3991 11.4289 11 13.5 11" stroke="#12293A" stroke-width="1.5" stroke-linecap="round" />
            <path d="M13.5 27.25C13.5 28.5761 14.2902 29.8479 15.6967 30.7855C17.1032 31.7232 19.0109 32.25 21 32.25C22.9891 32.25 24.8968 31.7232 26.3033 30.7855C27.7098 29.8479 28.5 28.5761 28.5 27.25C28.5 25.9239 27.7098 24.6521 26.3033 23.7145C24.8968 22.7768 22.9891 22.25 21 22.25C19.0109 22.25 17.1032 22.7768 15.6967 23.7145C14.2902 24.6521 13.5 25.9239 13.5 27.25Z" stroke="#12293A" stroke-width="1.5" />
            <path d="M31 29.75C33.1927 29.2691 34.75 28.0514 34.75 26.625C34.75 25.1986 33.1927 23.9809 31 23.5" stroke="#12293A" stroke-width="1.5" stroke-linecap="round" />
            <path d="M11 29.75C8.80719 29.2691 7.25 28.0514 7.25 26.625C7.25 25.1986 8.80719 23.9809 11 23.5" stroke="#12293A" stroke-width="1.5" stroke-linecap="round" />
        </svg>
    );
};

export default ManageStudentsIcon;
