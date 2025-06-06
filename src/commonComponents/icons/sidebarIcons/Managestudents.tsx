import React from "react";
import manageStudentsActive from "../../icons/admin/nav/student-active.png";
import manageStudentsInactive from "../../icons/admin/nav/studentmanagement.png";

interface ManageStudentsIconProps {
    isActive: boolean;
}

const ManageStudentsIcon: React.FC<ManageStudentsIconProps> = ({ isActive }) => {
    return (
       <img src={isActive ? manageStudentsActive : manageStudentsInactive} alt="Manage Students" />
    );
};

export default ManageStudentsIcon;
