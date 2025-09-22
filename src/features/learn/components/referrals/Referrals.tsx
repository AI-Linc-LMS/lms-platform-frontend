import Referralsicon from "../../../../commonComponents/icons/referrals/Referralsicon";

const Referrals = () => {
  return (
    <div className="lg:min-w-[270px] xl:min-w-[350px] rounded-3xl bg-white p-4 mt-28">
      <h1 className="text-xl font-semibold text-[#343A40] mb-3">Referrals</h1>
      <p className="font-normal  text-[14px] text-[var(--netural-400)] mb-10">
        Invite your friends and earn exciting rewards
      </p>
      <div>
        <Referralsicon />
      </div>
      <button className="w-full h-[55px] bg-[#2A8CB0] rounded-2xl text-[16px]  font-medium text-white mt-2 cursor-pointer hover:scale-95 transition-transform duration-200 ease-in-out">
        Copy Invitation Link
      </button>
    </div>
  );
};

export default Referrals;
