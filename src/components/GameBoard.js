import { useState, useRef, useEffect } from "react";
import shuffle from "../shuffle";

const defaultState = { index: null, value: null };

export default function MemoryGame() {
	const [allItems, setAllItems] = useState([]);
	const [items, setItems] = useState([0, 1]); // Default 4 cards (2 pairs)
	const [firstCard, setFirstCard] = useState(defaultState);
	const [secondCard, setSecondCard] = useState(defaultState);
	const [remainingCards, setRemainingCards] = useState([]);
	const [moves, setMoves] = useState(0);
	const [time, setTime] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [history, setHistory] = useState([]);
	const [background, setBackground] = useState("#130f40");
	const [showSettings, setShowSettings] = useState(false);

	const timerRef = useRef();
	const flipTimeoutRef = useRef();

	useEffect(() => {
		// Load game history and initialize the board
		const storedHistory = JSON.parse(localStorage.getItem("gameHistory")) || [];
		setHistory(storedHistory);
		resetGame();
	}, []);

	useEffect(() => {
		// Timer logic
		if (isPlaying) {
			timerRef.current = setInterval(() => {
				setTime((prevTime) => prevTime + 1);
			}, 1000);
		} else {
			clearInterval(timerRef.current);
		}
		return () => clearInterval(timerRef.current);
	}, [isPlaying]);

	useEffect(() => {
		// Check if the game is won
		if (remainingCards.length === 0 && isPlaying) {
			setIsPlaying(false);
			clearInterval(timerRef.current);
			saveGameToHistory();
		}
	}, [remainingCards]);


	const saveGameToHistory = () => {
		const newGame = {
			time: `${Math.floor(time / 60)}:${String(time % 60).padStart(2, "0")}`,
			moves,
			date: new Date().toLocaleString(),
		};
		const updatedHistory = [...history, newGame];
		setHistory(updatedHistory);
		localStorage.setItem("gameHistory", JSON.stringify(updatedHistory));
	};

	// Reset game based on card count
	const resetGame = () => {
		// Create pairs of items based on selected card count
		const shuffledItems = shuffle([...items, ...items]);

		// Update the state for allItems and remainingCards
		setAllItems(shuffledItems);
		setRemainingCards(shuffledItems); // Set all cards as remaining initially
		setFirstCard(defaultState);
		setSecondCard(defaultState);
		setMoves(0);
		setTime(0);
		setIsPlaying(false);
		clearTimeout(flipTimeoutRef.current);
	};
	const handleStartPause = () => {
		if (remainingCards.length > 0) {
			setIsPlaying((prevState) => !prevState);
		}
	};

	const handleClick = (index, value) => {
		// Ignore clicks if the game is paused
		if (!isPlaying) return;

		// Reset the timeout if a card is clicked
		clearTimeout(flipTimeoutRef.current);

		flipTimeoutRef.current = setTimeout(() => {
			setFirstCard(defaultState);
			setSecondCard(defaultState);
		}, 2000);

		// Logic for card matching
		if (
			firstCard.index === null ||
			(firstCard.index !== null && secondCard.index !== null)
		) {
			setSecondCard(defaultState);
			setFirstCard({ index, value });
			setMoves((prevMoves) => prevMoves + 1);
		} else if (secondCard.index === null && firstCard.index !== index) {
			setSecondCard({ index, value });
			setMoves((prevMoves) => prevMoves + 1);

			if (firstCard.value === value) {
				setRemainingCards((prevRemaining) =>
					prevRemaining.filter((card) => card !== value)
				);
			}
		}
	};

	const handleSettingsChange = (cardCount, bgColor) => {
		if (cardCount) {
			// Create a new items array based on the selected card count
			const newItems = Array.from({ length: cardCount / 2 }, (_, i) => i);
			setItems(newItems);  // Set new items
			setRemainingCards(newItems);  // Set remaining cards based on the new items
			resetGame();
		}
		if (bgColor) {
			setBackground(bgColor);
		}
		resetGame();
	};

	const calculateColumns = (totalCards) => {
		if (totalCards === 4) return 2; // 2x2 grid
		else return 8; // 8x4 grid
	};


	return (
		<div >
			<h1>Memory Game</h1>
			<div>
				<button onClick={handleStartPause}>{isPlaying ? "Pause" : "Start"}</button>
				<button onClick={resetGame} style={{ marginLeft: "10px" }}>
					Reset
				</button>
				<button onClick={() => setShowSettings(!showSettings)} style={{ marginLeft: "10px" }}>
					Settings
				</button>
			</div>
			{showSettings && (
				<div style={{ margin: "20px 0" }}>
					<h2>Settings</h2>
					<div>
						<label>Number of Cards: </label>
						<select onChange={(e) => handleSettingsChange(Number(e.target.value), null)}>
							<option value="4">4</option>
							<option value="16">16</option>
							<option value="32">32</option>
						</select>
					</div>
					<div>
						<label>Background Color: </label>
						<input
							type="color"
							onChange={(e) => handleSettingsChange(null, e.target.value)}
							value={background}
						/>
					</div>
				</div>
			)}
			<p>
				Time: {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")} | Moves: {moves}
			</p>
			<p>{remainingCards.length > 0 ? `Remaining cards: ${remainingCards.length}` : "Victory!"}</p>
			<div className="cardsContainer" style={{
				gridTemplateColumns: `repeat(${calculateColumns(allItems.length)}, 1fr)`,
			}}>
				{allItems.map((item, index) => (
					<div
						key={index}
						className={`card ${(firstCard.index === index || secondCard.index === index || !remainingCards.includes(item)) && "flipped"}`}
						onClick={() => handleClick(index, item)}
					>
						<div className="backSide"></div>
						<img alt={`cat ${index}`} src={`https://robohash.org/${item}?set=set4&size=120x120`} />
					</div>
				))}
			</div>
			<h2>Game History</h2>
			<ul style={{ listStyle: "none", padding: 0 }}>
				{history.length > 0 ? (
					history.map((game, index) => (
						<li key={index} >
							<strong>Game {index + 1}</strong>: {game.moves} moves in {game.time} (Played on {game.date})
						</li>
					))
				) : (
					<p>No games played yet!</p>
				)}
			</ul>
		</div>
	);
}
