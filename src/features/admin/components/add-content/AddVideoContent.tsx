import React, { useState } from "react";
import backIcon from "../../../../commonComponents/icons/admin/content/backIcon.png";
interface AddVideoContentProps {
    onBack: () => void;
}

const AddVideoContent: React.FC<AddVideoContentProps> = ({ onBack }) => {
    const [title, setTitle] = useState("");
    const [marks, setMarks] = useState("");
    const [link, setLink] = useState("");


    const handleSave = () => {
        console.log(title, marks, link);
    }


    return (
        <div className="w-full space-y-6">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="text-sm font-medium mb-4 flex items-center"
            >
                <img src={backIcon} alt="Back" className="w-3 h-2 mr-2" />
                Back to Content Library
            </button>

            {/* Title & Marks */}
            <div className="border border-gray-300 rounded-lg p-2 px-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">Video Title</label>
                        <input
                            type="text"
                            placeholder="Enter title here"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                        />
                    </div>
                    <div className="w-full md:w-1/3">
                        <label className="text-sm font-medium text-gray-700">Marks</label>
                        <input
                            type="number"
                            placeholder="Enter Marks"
                            value={marks}
                            onChange={(e) => setMarks(e.target.value)}
                            className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                        />
                    </div>
                </div>

                {/* Video Link */}
                <div>
                    <label className="text-sm font-medium text-gray-700">Paste the link to the Video</label>
                    <input
                        type="text"
                        placeholder="Enter link here"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                    />
                </div>

                {/* OR Divider */}
                <div className="flex items-center justify-center gap-2">
                    <hr className="w-full border-dashed border-gray-300" />
                    <span className="text-gray-500 text-sm">OR</span>
                    <hr className="w-full border-dashed border-gray-300" />
                </div>

                {/* Upload Box */}
                <div className="border border-gray-300 rounded-lg flex flex-col items-center justify-center py-10 text-center">
                    <div className="bg-blue-100 w-12 h-12 rounded-full mb-2">
                        <span className="text-4xl font-bold text-[#255C79]">+</span>
                    </div>
                    <p className="text-sm font-medium">Drag or Upload the file</p>
                    <p className="text-xs text-gray-400">File Size Limit: 1GB</p>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button className="px-6 py-2 bg-[#255C79] text-white rounded-xl transition"
                        onClick={handleSave}>
                        Save Content
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddVideoContent;
