import Referralsicon from "../../../../commonComponents/icons/referrals/Referralsicon";

const Referrals = () => {
  return (
    <div className="lg:min-w-[270px] xl:min-w-[350px] rounded-3xl bg-white p-4 mt-28">
      <h1 className="text-xl font-semibold text-[var(--neutral-500)] mb-3">
        Referrals
      </h1>
      <p className="font-normal  text-[14px] text-[var(--neutral-400)] mb-10">
        Invite your friends and earn exciting rewards
      </p>
      <div>
        <Referralsicon />
      </div>
      <button className="w-full h-[55px] bg-[var(--primary-400)] rounded-2xl text-[16px]  font-medium text-[var(--font-light)] mt-2 cursor-pointer hover:scale-95 transition-transform duration-200 ease-in-out">
        Copy Invitation Link
      </button>
    </div>
  );
};

export default Referrals;
