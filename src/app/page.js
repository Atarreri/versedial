"use client";

import { useEffect, useRef, useState } from "react";
import { stations } from "../data/poems";

export default function Home() {
  const [dial, setDial] = useState(25);
  const [stationIndex, setStationIndex] = useState(1);
  const [poemIndex, setPoemIndex] = useState(0);
  const [power, setPower] = useState(true);
  const [dragging, setDragging] = useState(false);
const [playing, setPlaying] = useState(false);
const [visibleLines, setVisibleLines] = useState(999);

  const startX = useRef(0);
  const startDial = useRef(0);
  const lastClickStep = useRef(null);
  const audioContext = useRef(null);

  const station = stations[stationIndex];
  const poem = station.poems[poemIndex];
const poemLines = poem.text.split("\n");

useEffect(() => {
  if (!playing) return;

  if (visibleLines >= poemLines.length) {
    const finishTimer = setTimeout(() => {
      setPlaying(false);
    }, 700);

    return () => clearTimeout(finishTimer);
  }

  const timer = setTimeout(() => {
    setVisibleLines((current) => current + 1);
  }, 850);

  return () => clearTimeout(timer);
}, [playing, visibleLines, poemLines.length]);

function playPoem() {
  if (!power || dragging) return;

  setVisibleLines(0);
  setPlaying(true);
}
  function makeClick(stronger = false) {
    try {
      if (!audioContext.current) {
        audioContext.current = new (
          window.AudioContext || window.webkitAudioContext
        )();
      }

      const ctx = audioContext.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "square";
      oscillator.frequency.value = stronger ? 115 : 80;

      gain.gain.setValueAtTime(
        stronger ? 0.035 : 0.018,
        ctx.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + 0.025
      );

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.025);
    } catch {
      // Sound is optional.
    }
  }

  function randomPoemForStation(index, avoidIndex = -1) {
    const poems = stations[index].poems;

    if (poems.length <= 1) {
      return 0;
    }

    let next = Math.floor(Math.random() * poems.length);

    while (next === avoidIndex) {
      next = Math.floor(Math.random() * poems.length);
    }

    return next;
  }

  function beginDrag(event) {
  if (!power) return;

  setDragging(true);

  startX.current = event.clientX;
  startDial.current = dial;

  event.currentTarget.setPointerCapture(event.pointerId);
}

  function dragKnob(event) {
    if (!dragging || !power) return;

    const difference =
      event.clientX - startX.current;

    let nextDial =
      startDial.current + difference / 3;

    nextDial =
      Math.max(0, Math.min(100, nextDial));

    setDial(nextDial);

    const clickStep =
      Math.round(nextDial / 4);

    if (clickStep !== lastClickStep.current) {
      lastClickStep.current = clickStep;
      makeClick(false);
    }

    const nearestStation =
      Math.round(nextDial / 25);

    if (nearestStation !== stationIndex) {
      setStationIndex(nearestStation);

      setPoemIndex(
        randomPoemForStation(nearestStation)
      );
    }
  }

  function endDrag(event) {
  if (!dragging) return;

  setDragging(false);

  const movement =
    Math.abs(event.clientX - startX.current);

  const nearestStation =
    Math.round(dial / 25);

  const snappedDial =
    nearestStation * 25;

  setDial(snappedDial);

  // A simple click on the knob:
  // give me another poem on this station.
  if (movement < 5) {
    setPoemIndex(
      randomPoemForStation(
        stationIndex,
        poemIndex
      )
    );

    makeClick(true);
    return;
  }

  // A real drag:
  // tune to the station we landed on.
  if (nearestStation !== stationIndex) {
    setStationIndex(nearestStation);

    setPoemIndex(
      randomPoemForStation(nearestStation)
    );
  }

  makeClick(true);
}

  function chooseStation(index) {
    if (!power) return;

    const avoid =
      index === stationIndex
        ? poemIndex
        : -1;

    const nextPoem =
      randomPoemForStation(index, avoid);

    setStationIndex(index);
    setDial(index * 25);
    setPoemIndex(nextPoem);

    makeClick(true);
  }

  const needlePosition =
    7 + dial * 0.86;

  const knobRotation =
    -135 + dial * 2.7;

  const stationCenter =
    stationIndex * 25;

  const distanceFromStation =
    Math.abs(dial - stationCenter);

  const tuned =
    distanceFromStation < 7 && !dragging;

  return (
    <main className="room">
      <div className="receiver">

        <div className="wood" />

        <div className="face">

          <header className="brand">
            <div className="brandName">
              VerseDial
            </div>

            <div className="brandSub">
              POETRY RECEIVER
            </div>
          </header>

          <section
            className={`dialWindow ${
              power ? "" : "off"
            }`}
          >

            <div className="dialGlow" />

            <div
              className="needle"
              style={{
                left: `${needlePosition}%`,
              }}
            />

            <div className="scaleTicks">
              {Array.from({ length: 51 }).map(
                (_, i) => (
                  <span
                    key={i}
                    className={
                      i % 5 === 0
                        ? "longTick"
                        : ""
                    }
                  />
                )
              )}
            </div>

            <div className="stationScale">
              {stations.map((item, index) => (
                <button
                  key={item.name}
                  className={
                    index === stationIndex
                      ? "station active"
                      : "station"
                  }
                  onClick={() =>
                    chooseStation(index)
                  }
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className="frequencyMarks">
              <span>88</span>
              <span>92</span>
              <span>96</span>
              <span>100</span>
              <span>104</span>
              <span>108</span>
            </div>

          </section>

          <div className="divider" />

          <section className="lowerPanel">

            <div
              className={`poemScreen ${
                power ? "" : "screenOff"
              }`}
            >

              {!power ? (
                <div className="silence">
                  NO SIGNAL
                </div>
              ) : dragging ? (
                <div className="staticState">
                  <div className="staticWord">
                    SEARCHING
                  </div>
                  <div className="staticLine" />
                </div>
              ) : tuned ? (
                <>
                  <div className="signal">
                    RECEIVING &nbsp;•&nbsp;{" "}
                    {station.name}
                  </div>

                  <div className="poemText">
  {poemLines.map((line, index) => (
    <div
      key={`${poem.title}-${index}`}
      className={
        index < visibleLines
          ? "poemLine visible"
          : "poemLine"
      }
    >
      {line || "\u00A0"}
    </div>
  ))}
</div>

<div
  className={`poemInfo ${
    !playing ||
    visibleLines >= poemLines.length
      ? "infoVisible"
      : "infoHidden"
  }`}
>
  <span className="poemTitle">
    {poem.title}
  </span>

  <span className="poet">
    {poem.author}
  </span>
</div>
                </>
              ) : (
                <div className="staticState">
                  <div className="staticWord">
                    SEARCHING
                  </div>
                </div>
              )}

            </div>

            <div className="speaker">
              {Array.from({ length: 140 }).map(
                (_, i) => (
                  <span key={i} />
                )
              )}
            </div>

          </section>

          <section className="controls">

            <div className="controlGroup">

              <button
                className={`powerButton ${
                  power ? "on" : ""
                }`}
                onClick={() =>
                  setPower(!power)
                }
                aria-label="Power"
              >
                <span />
              </button>

              <div className="controlLabel">
                POWER
              </div>

            </div>

            <div className="tuneGroup">

              <button
                className={`tuningKnob ${
                  dragging
                    ? "dragging"
                    : ""
                }`}
                onPointerDown={beginDrag}
                onPointerMove={dragKnob}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                style={{
                  transform:
                    `rotate(${knobRotation}deg)`,
                }}
                aria-label="Tuning knob"
              >
                <span className="knobMarker" />
              </button>

              <div className="controlLabel bigLabel">
                TUNING
              </div>

              <div className="instruction">
                DRAG ← &nbsp; → DRAG
              </div>

            </div>

            <div className="emptyControl">
  <button
    className={`playButton ${
      playing ? "playing" : ""
    }`}
    onClick={playPoem}
    aria-label="Play poem"
  >
    ▶
  </button>

  <div className="controlLabel">
    PLAY
  </div>
</div>

            <div className="emptyControl">
              <button
                className="futureButton"
                disabled
                aria-label="Send coming soon"
              />

              <div className="controlLabel">
                SEND
              </div>
            </div>

          </section>

          <footer className="footer">
            TURN THE DIAL · FIND A POEM
          </footer>

        </div>

        <div className="wood" />

      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        button {
          font-family: inherit;
        }

        .room {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 35px 18px;

          background:
            radial-gradient(
              circle at 50% 35%,
              #34312d 0%,
              #181715 50%,
              #080808 100%
            );

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          user-select: none;
        }

        .receiver {
          width: 1050px;
          max-width: 100%;
          overflow: hidden;
          border-radius: 9px;

          box-shadow:
            0 35px 90px rgba(0,0,0,.8),
            0 5px 12px rgba(0,0,0,.8);
        }

        .wood {
          height: 30px;

          background:
            repeating-linear-gradient(
              3deg,
              rgba(255,255,255,.025) 0px,
              rgba(255,255,255,.025) 1px,
              transparent 1px,
              transparent 5px
            ),
            linear-gradient(
              90deg,
              #35190b,
              #6c3619 25%,
              #47200e 53%,
              #743b1c 78%,
              #301509
            );
        }

        .face {
          padding: 34px 46px 27px;

          color: #292725;

          background:
            linear-gradient(
              90deg,
              rgba(255,255,255,.36),
              transparent 15%,
              rgba(255,255,255,.17) 48%,
              transparent 82%
            ),
            linear-gradient(
              #d8d5cd,
              #aaa79f 52%,
              #d2cfc7
            );

          border-left: 5px solid #552711;
          border-right: 5px solid #552711;
        }

        .brand {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 20px;
        }

        .brandName {
          font-family: Georgia, serif;
          font-size: 28px;
          font-weight: bold;
          font-style: italic;
          color: #282522;

          text-shadow:
            0 1px rgba(255,255,255,.8);
        }

        .brandSub {
          font-size: 9px;
          letter-spacing: 5px;
          color: #57534e;
        }

        .dialWindow {
          position: relative;
          height: 145px;
          overflow: hidden;

          border: 8px solid #252423;
          border-radius: 3px;

          background:
            linear-gradient(
              180deg,
              #061c23,
              #0a3947 48%,
              #05181e
            );

          box-shadow:
            inset 0 0 30px #000,
            0 2px 2px rgba(255,255,255,.6);

          transition: filter .4s;
        }

        .dialWindow.off {
          filter: brightness(.16);
        }

        .dialGlow {
          position: absolute;
          inset: 0;

          background:
            radial-gradient(
              ellipse at center,
              rgba(73,210,255,.27),
              transparent 67%
            );

          pointer-events: none;
        }

        .needle {
          position: absolute;
          z-index: 5;
          top: 12px;
          bottom: 13px;

          width: 2px;

          background: #ffc45d;

          box-shadow:
            0 0 5px #ffbd47,
            0 0 13px #ff9828;
        }

        .scaleTicks {
          position: absolute;
          left: 6%;
          right: 6%;
          top: 21px;

          display: flex;
          justify-content: space-between;

          height: 13px;
        }

        .scaleTicks span {
          width: 1px;
          height: 5px;

          background:
            rgba(210,241,245,.62);
        }

        .scaleTicks .longTick {
          height: 11px;
        }

        .stationScale {
          position: absolute;
          top: 49px;
          left: 4%;
          right: 4%;

          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .station {
          padding: 5px;
          border: 0;

          cursor: pointer;

          background: transparent;

          color:
            rgba(204,238,243,.55);

          font-size: 11px;
          letter-spacing: 2px;

          transition: .2s;
        }

        .station:hover,
        .station.active {
          color: #efffff;

          text-shadow:
            0 0 5px #8be6ff,
            0 0 12px #58c6e6;
        }

        .station.active {
          font-weight: bold;
        }

        .frequencyMarks {
          position: absolute;
          bottom: 17px;
          left: 7%;
          right: 7%;

          display: flex;
          justify-content: space-between;

          color:
            rgba(194,228,234,.42);

          font-size: 8px;
          letter-spacing: 1px;
        }

        .divider {
          height: 2px;
          margin: 25px 0;

          background:
            rgba(40,40,40,.35);

          box-shadow:
            0 1px rgba(255,255,255,.5);
        }

        .lowerPanel {
          display: grid;
          grid-template-columns: 1.65fr .65fr;
          gap: 28px;

          min-height: 300px;
        }

        .poemScreen {
          position: relative;

          min-height: 300px;

          padding: 32px 35px;

          overflow: hidden;

          color: #d9f3e4;

          background:
            radial-gradient(
              ellipse at center,
              rgba(31,90,71,.72),
              rgba(6,27,23,.98) 72%
            );

          border: 7px solid #2d2b28;
          border-radius: 3px;

          box-shadow:
            inset 0 0 45px rgba(0,0,0,.75),
            0 1px 1px rgba(255,255,255,.7);

          transition: .25s;
        }

        .poemScreen:after {
          content: "";

          position: absolute;
          inset: 0;

          pointer-events: none;

          opacity: .09;

          background:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              #fff 3px
            );
        }

        .screenOff {
          background: #111;
        }

        .signal {
          margin-bottom: 25px;

          color: #8ecab0;

          font-size: 9px;
          letter-spacing: 4px;
        }

        .poemText {
          white-space: pre-line;

          font-family:
            Georgia,
            serif;

          font-size:
            clamp(17px, 2vw, 22px);

          line-height: 1.58;

          text-shadow:
            0 0 8px
            rgba(151,255,202,.18);
        }.poemLine {
  min-height: 1.58em;
  opacity: 0;
  transform: translateY(5px);
  filter: blur(2px);

  transition:
    opacity .7s ease,
    transform .7s ease,
    filter .7s ease;
}

.poemLine.visible {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}

.infoHidden {
  opacity: 0;
}

.infoVisible {
  opacity: 1;
}

.poemInfo {
  transition: opacity .8s ease;
}

.playButton {
  width: 45px;
  height: 28px;

  cursor: pointer;

  border:
    2px solid #77736c;

  border-radius: 3px;

  color: #383530;

  background:
    linear-gradient(
      #ddd9d0,
      #99958d
    );

  box-shadow:
    0 3px 4px rgba(0,0,0,.3),
    inset 0 1px white;

  font-size: 10px;
}

.playButton:active,
.playButton.playing {
  transform: translateY(2px);

  box-shadow:
    0 1px 2px rgba(0,0,0,.4),
    inset 0 2px 4px rgba(0,0,0,.2);
}

        .poemInfo {
          display: flex;
          flex-direction: column;
          gap: 5px;

          margin-top: 25px;

          font-family:
            Georgia,
            serif;
        }

        .poemTitle {
          font-size: 15px;
          font-style: italic;
        }

        .poet {
          color: #91b8a6;

          font-size: 11px;
          letter-spacing: 1px;
        }

        .silence,
        .staticState {
          height: 100%;
          min-height: 220px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .silence {
          color: #555;

          font-size: 10px;
          letter-spacing: 5px;
        }

        .staticWord {
          color: #79a995;

          font-size: 9px;
          letter-spacing: 6px;

          opacity: .7;
        }

        .staticLine {
          width: 65%;
          height: 1px;

          margin-top: 18px;

          background:
            linear-gradient(
              90deg,
              transparent,
              #82b6a0,
              transparent
            );

          animation:
            staticPulse .15s infinite alternate;
        }

        @keyframes staticPulse {
          from {
            opacity: .2;
            transform: scaleX(.8);
          }

          to {
            opacity: .8;
            transform: scaleX(1);
          }
        }

        .speaker {
          display: grid;

          grid-template-columns:
            repeat(10, 1fr);

          gap: 8px;

          align-content: center;
          justify-items: center;

          padding: 23px;

          border:
            5px solid #33312e;

          border-radius: 3px;

          background:
            linear-gradient(
              #494744,
              #242321
            );

          box-shadow:
            inset 0 0 30px #111,
            0 1px 1px rgba(255,255,255,.6);
        }

        .speaker span {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #090909;

          box-shadow:
            inset 0 1px 1px #000,
            0 1px rgba(255,255,255,.08);
        }

        .controls {
          display: flex;

          align-items: flex-end;
          justify-content: space-around;

          gap: 25px;

          margin-top: 30px;
        }

        .controlGroup,
        .tuneGroup,
        .emptyControl {
          display: flex;
          flex-direction: column;
          align-items: center;

          gap: 10px;
        }

        .controlLabel {
          color: #4d4944;

          font-size: 8px;
          letter-spacing: 2px;

          text-shadow:
            0 1px rgba(255,255,255,.7);
        }

        .bigLabel {
          letter-spacing: 4px;
        }

        .instruction {
          margin-top: -4px;

          color: #77716a;

          font-size: 7px;
          letter-spacing: 2px;
        }

        .powerButton {
          width: 36px;
          height: 36px;

          padding: 0;

          cursor: pointer;

          border-radius: 50%;

          border:
            5px solid #383633;

          background:
            radial-gradient(
              circle,
              #242321,
              #111
            );

          box-shadow:
            0 3px 4px rgba(0,0,0,.4),
            inset 0 1px rgba(255,255,255,.2);
        }

        .powerButton span {
          display: block;

          width: 7px;
          height: 7px;

          margin: auto;

          border-radius: 50%;

          background: #48110c;
        }

        .powerButton.on span {
          background: #e8492e;

          box-shadow:
            0 0 6px #e8492e,
            0 0 13px #e8492e;
        }

        .tuningKnob {
          position: relative;

          width: 112px;
          height: 112px;

          touch-action: none;

          cursor: grab;

          border-radius: 50%;

          border:
            7px solid #74716b;

          background:
            repeating-linear-gradient(
              90deg,
              rgba(0,0,0,.16) 0px,
              rgba(0,0,0,.16) 1px,
              transparent 1px,
              transparent 3px
            ),
            radial-gradient(
              circle at 40% 35%,
              #e0ddd5,
              #99968f 55%,
              #55524d
            );

          box-shadow:
            0 7px 9px rgba(0,0,0,.4),
            inset 0 3px 3px rgba(255,255,255,.7);

          transition:
            box-shadow .15s;
        }

        .tuningKnob.dragging {
          cursor: grabbing;

          box-shadow:
            0 4px 6px rgba(0,0,0,.5),
            inset 0 3px 6px rgba(0,0,0,.2);
        }

        .knobMarker {
          position: absolute;

          width: 3px;
          height: 19px;

          top: 8px;
          left: 50%;

          transform:
            translateX(-50%);

          border-radius: 2px;

          background: #292725;
        }

        .futureButton {
          width: 45px;
          height: 28px;

          border:
            2px solid #77736c;

          border-radius: 3px;

          opacity: .4;

          background:
            linear-gradient(
              #ddd9d0,
              #99958d
            );

          box-shadow:
            0 3px 4px rgba(0,0,0,.2),
            inset 0 1px white;
        }

        .footer {
          margin-top: 26px;
          padding-top: 15px;

          text-align: center;

          border-top:
            1px solid rgba(60,60,60,.3);

          color: #57534d;

          font-size: 8px;
          letter-spacing: 5px;
        }

        @media (max-width: 720px) {
          .room {
            padding: 12px 7px;
            align-items: flex-start;
          }

          .face {
            padding: 23px 16px;
          }

          .brand {
            flex-direction: column;
            align-items: flex-start;
            gap: 7px;
          }

          .brandName {
            font-size: 25px;
          }

          .brandSub {
            font-size: 7px;
          }

          .dialWindow {
            height: 125px;
          }

          .station {
            font-size: 7px;
            letter-spacing: 0;
          }

          .lowerPanel {
            grid-template-columns: 1fr;
          }

          .speaker {
            display: none;
          }

          .poemScreen {
            min-height: 330px;
            padding: 28px 23px;
          }

          .controls {
            gap: 10px;
          }

          .tuningKnob {
            width: 90px;
            height: 90px;
          }

          .futureButton {
            width: 37px;
          }

          .footer {
            letter-spacing: 2px;
          }
        }
      `}</style>
    </main>
  );
}