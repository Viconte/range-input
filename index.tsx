import * as React from 'react';
import cn from 'classnames';
import s from './index.scss';

interface IProps extends React.Props<any> {
  className?: string;
  sliderClassName?: string;
  railClassName?: string;
  trackClassName?: string;
  beginValue?: number;
  endValue?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  onChange?: (values: { min: number; max: number }) => void;
}

const SLIDER_MIN = 'min';
const SLIDER_MAX = 'max';

export const RangeInput = React.memo(
  ({
    className,
    sliderClassName,
    railClassName,
    trackClassName,
    beginValue = 0,
    endValue = 100,
    minValue,
    maxValue,
    step = 1,
    onChange,
  }: IProps) => {
    const beginValueCorrected = Math.min(beginValue, endValue);
    const endValueCorrected = Math.max(beginValue, endValue);

    if (beginValue === endValue) {
      return null;
    }

    const stepPercent =
      (step * 100) / (endValueCorrected - beginValueCorrected);

    const [isStartMovingSlider, setIsStartMovingSlider] = React.useState<
      boolean
    >(false);
    const [isMovingSlider, setIsMovingSlider] = React.useState<boolean>(false);
    const [typeMovingSlider, setTypeMovingSlider] = React.useState<string>(
      null,
    );

    const [minPercent, setMinPercent] = React.useState<number>(null);
    const [maxPercent, setMaxPercent] = React.useState<number>(null);

    /**
     * Вычисление перемещения с заданным шагом
     */
    const getPercentWithStep = React.useCallback(
      valuePercent => {
        if (valuePercent > 100) return 100;
        if (valuePercent < 0) return 0;

        if (step) {
          const leftBorderStep = valuePercent - (valuePercent % stepPercent);
          const rigthBorderStep = leftBorderStep + stepPercent;

          return valuePercent - leftBorderStep < rigthBorderStep - valuePercent
            ? leftBorderStep
            : rigthBorderStep;
        }
        return valuePercent;
      },
      [step, stepPercent],
    );

    /**
     * Преобразование числовых значений в проценты
     */
    React.useEffect(() => {
      let minValueCorrected = minValue;
      let maxValueCorrected = maxValue;

      // Корректировка диапазона
      if (
        minValueCorrected !== undefined &&
        maxValueCorrected !== undefined &&
        minValue > maxValue
      ) {
        minValueCorrected = maxValue;
        maxValueCorrected = minValue;
      }

      if (minValueCorrected === undefined) {
        setMinPercent(0);
      } else {
        const min =
          minValueCorrected < beginValueCorrected
            ? beginValueCorrected
            : minValueCorrected;
        setMinPercent(
          getPercentWithStep(
            ((min - beginValueCorrected) * 100) /
              (endValueCorrected - beginValueCorrected),
          ),
        );
      }

      if (maxValueCorrected === undefined) {
        setMaxPercent(100);
      } else {
        const max =
          maxValueCorrected > endValueCorrected
            ? endValueCorrected
            : maxValueCorrected;
        setMaxPercent(
          getPercentWithStep(
            ((max - beginValueCorrected) * 100) /
              (endValueCorrected - beginValueCorrected),
          ),
        );
      }
    }, [
      minValue,
      maxValue,
      beginValueCorrected,
      endValueCorrected,
      getPercentWithStep,
    ]);

    const rootRef = React.useRef<HTMLDivElement>();

    /**
     * Получить значение в абсолютных единицах из процентов
     */
    const getValueFromPercent = React.useCallback(
      (percentValue: number) => {
        return (
          Math.round(
            (percentValue * (endValueCorrected - beginValueCorrected)) / 100,
          ) + beginValueCorrected
        );
      },
      [beginValueCorrected, endValueCorrected],
    );

    /**
     * onChange который принимает значение в процентах, обновляет стейт и прокидывает абсолютные значения родителю
     */
    const onChangePercentsCallback = React.useCallback(
      (newMinPercent: number, newMaxPercent: number) => {
        const newMinValue = getValueFromPercent(newMinPercent);
        const newMaxValue = getValueFromPercent(newMaxPercent);

        if (newMinPercent !== minPercent) {
          setMinPercent(newMinPercent);
        }
        if (newMaxPercent !== maxPercent) {
          setMaxPercent(newMaxPercent);
        }
        onChange({ min: newMinValue, max: newMaxValue });
      },
      [getValueFromPercent, maxPercent, minPercent, onChange],
    );

    /**
     * Перемещение по клику
     */
    const handlerClick = React.useCallback(
      e => {
        if (rootRef.current) {
          const widthRange = rootRef.current.clientWidth;
          const diffRange =
            e.pageX - rootRef.current.getBoundingClientRect().left;
          const diffRangePercent = getPercentWithStep(
            (diffRange * 100) / widthRange,
          );
          const distanceToMinSlider = Math.abs(diffRangePercent - minPercent);
          const distanceToMaxSlider = Math.abs(diffRangePercent - maxPercent);

          if (minPercent === maxPercent) {
            if (diffRangePercent > maxPercent) {
              onChangePercentsCallback(minPercent, diffRangePercent);
            } else {
              onChangePercentsCallback(diffRangePercent, maxPercent);
            }
          } else if (distanceToMinSlider < distanceToMaxSlider) {
            onChangePercentsCallback(diffRangePercent, maxPercent);
          } else {
            onChangePercentsCallback(minPercent, diffRangePercent);
          }
        }
      },
      [getPercentWithStep, maxPercent, minPercent, onChangePercentsCallback],
    );

    /**
     * Перемещение по drag & drop
     */
    const handleSliderStart = React.useCallback(type => {
      setIsStartMovingSlider(true);
      setTypeMovingSlider(type);
    }, []);

    const handleSliderMove = React.useCallback(
      e => {
        if (rootRef.current && isStartMovingSlider) {
          setIsMovingSlider(true);
          const widthRange = rootRef.current.clientWidth;
          const diffRange =
            (e.type === 'touchmove' ? e.touches[0].pageX : e.pageX) -
            rootRef.current.getBoundingClientRect().left;
          const diffRangePercent = getPercentWithStep(
            (diffRange * 100) / widthRange,
          );

          if (
            typeMovingSlider === SLIDER_MIN &&
            diffRangePercent > maxPercent
          ) {
            setTypeMovingSlider(SLIDER_MAX);
            onChangePercentsCallback(maxPercent, diffRangePercent);
          } else if (
            typeMovingSlider === SLIDER_MAX &&
            diffRangePercent < minPercent
          ) {
            setTypeMovingSlider(SLIDER_MIN);
            onChangePercentsCallback(diffRangePercent, minPercent);
          } else if (typeMovingSlider === SLIDER_MIN && diffRangePercent >= 0) {
            onChangePercentsCallback(diffRangePercent, maxPercent);
          } else if (
            typeMovingSlider === SLIDER_MAX &&
            diffRangePercent <= 100
          ) {
            onChangePercentsCallback(minPercent, diffRangePercent);
          }
        }
      },
      [
        getPercentWithStep,
        isStartMovingSlider,
        maxPercent,
        minPercent,
        onChangePercentsCallback,
        typeMovingSlider,
      ],
    );

    const handleSliderEnd = React.useCallback(
      e => {
        if (isStartMovingSlider) {
          setIsStartMovingSlider(false);
          setTypeMovingSlider(null);
        }
        if (isMovingSlider) {
          e.stopPropagation();
          e.preventDefault();
          setIsMovingSlider(false);
        }
      },
      [isMovingSlider, isStartMovingSlider],
    );

    return (
      <div className={className}>
        <div
          className={s.root}
          onMouseDown={handlerClick}
          onMouseMove={handleSliderMove}
          onMouseLeave={handleSliderEnd}
          onMouseUp={handleSliderEnd}
          role="button"
          tabIndex={0}
          ref={rootRef}
        >
          <div onTouchMove={handleSliderMove} onTouchEnd={handleSliderEnd}>
            <div className={cn(s.rail, railClassName)}>
              <div className={s.railInner}>
                <div
                  className={cn(s.slider, sliderClassName)}
                  onTouchStart={() => {
                    handleSliderStart(SLIDER_MIN);
                  }}
                  onMouseDown={() => {
                    handleSliderStart(SLIDER_MIN);
                  }}
                  style={{ left: `${minPercent}%` }}
                  role="button"
                  tabIndex={0}
                />
                <div
                  className={cn(s.slider, sliderClassName)}
                  onTouchStart={() => {
                    handleSliderStart(SLIDER_MAX);
                  }}
                  onMouseDown={() => {
                    handleSliderStart(SLIDER_MAX);
                  }}
                  style={{ left: `${maxPercent}%` }}
                  role="button"
                  tabIndex={0}
                />
                <div
                  className={cn(s.track, trackClassName)}
                  style={{
                    left: `${minPercent}%`,
                    width: `${maxPercent - minPercent}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
