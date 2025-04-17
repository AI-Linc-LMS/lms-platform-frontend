
import Referralsicon from "../../../../commonComponents/icons/referrals/Referralsicon";

const Referrals = () => {
    return (
        <div className="w-[300px] rounded-3xl bg-white" >
            <h1 className="">Referrals</h1>
            <p className="font-normal font-sans text-[13px] text-[#495057]">Invite your friends and earn exciting rewards</p>
            <div>
                <Referralsicon />

            </div>
            <button className="w-full h-[55px] bg-[#2A8CB0] rounded-2xl text-[16px] font-sans font-medium text-white">
                Copy Invitation Link
            </button>

        </div>
    );

};

export default Referrals;