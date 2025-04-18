
import Referralsicon from "../../../../commonComponents/icons/referrals/Referralsicon";

const Referrals = () => {
    return (
        <div className="w-[300px] rounded-3xl bg-white p-4 mt-28" >
            <h1 className="text-3xl font-semibold text-[#343A40] mb-3">Referrals</h1>
            <p className="font-normal font-sans text-[14px] text-[#495057] mb-10">Invite your friends and earn exciting rewards</p>
            <div>
                <Referralsicon />
            </div>
            <button className="w-full h-[55px] bg-[#2A8CB0] rounded-2xl text-[16px] font-sans font-medium text-white mt-2">
                Copy Invitation Link
            </button>

        </div>
    );

};

export default Referrals;