interface ConfigStatusBannerProps {
  onOpenAuth: () => void;
  onOpenSetup: () => void;
}

export const ConfigStatusBanner = ({}: ConfigStatusBannerProps) => {
  // Return null to avoid redundant persistent banner cluttering screen real estate.
  // The Header and Settings already provide clear, professional database status.
  return null;
};
