import { useMemo } from 'react';
import Lottie from 'lottie-react';
import PropTypes from 'prop-types';

import antAnimation from '../../assets/lottie/animals/ant.json';
import babyChickAnimation from '../../assets/lottie/animals/baby-chick.json';
import batAnimation from '../../assets/lottie/animals/bat.json';
import beeAnimation from '../../assets/lottie/animals/bee.json';
import birdAnimation from '../../assets/lottie/animals/bird.json';
import blowfishAnimation from '../../assets/lottie/animals/blowfish.json';

const animalAnimations = {
  ant: antAnimation,
  'baby-chick': babyChickAnimation,
  bat: batAnimation,
  bee: beeAnimation,
  bird: birdAnimation,
  blowfish: blowfishAnimation,
};

export const DailyFunLottie = ({ animationKey, className }) => {
  const animationData = useMemo(() => {
    return animalAnimations[animationKey] || null;
  }, [animationKey]);

  if (!animationData) {
    return null;
  }

  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      className={className}
    />
  );
};

DailyFunLottie.propTypes = {
  animationKey: PropTypes.string.isRequired,
  className: PropTypes.string,
};
