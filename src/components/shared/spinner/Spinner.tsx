import { motion } from "framer-motion";

type TSpinner = {
  moduleName?: string;
};
const Spinner = ({ moduleName }: TSpinner) => <FinXLoader moduleName={moduleName}/>;

export default Spinner;



export const SimpleSpinnerPage = ({ moduleName }: TSpinner) => (
  <div className="w-[480px] flex flex-col items-center justify-center max-w-md mx-auto">
    <motion.div
      className="w-12 h-12 border-4 border-[#7a57e7] border-t-transparent rounded-full"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
    />
    <div className="my-4">{`Loading ${moduleName ? moduleName : ""}...`}</div>
  </div>
);

export const FinXLoader = ({moduleName}:TSpinner) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <motion.div
        className="relative flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute w-20 h-20 border-4 border-t-transparent border-[#3e2390] rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        />
        <motion.span
          className="text-[#7a57e7] text-sm font-bold"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        >
          FinX
        </motion.span>
      </motion.div>
      {/* <div className="my-8">{`Loading ${moduleName ? moduleName : ""}...`}</div> */}
      <div className="my-8">{moduleName}...</div>
    </div>
  );
};

