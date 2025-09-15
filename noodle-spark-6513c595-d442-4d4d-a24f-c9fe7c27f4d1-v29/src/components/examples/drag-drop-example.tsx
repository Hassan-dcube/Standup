/**
 * Drag and Drop Example
 * 
 * This file demonstrates how to implement drag and drop functionality
 * using react-dnd. This is commented out and serves as a reference
 * implementation for the AI to use when generating customized code.
 * 
 * Libraries demonstrated:
 * - react-dnd
 * - react-dnd-html5-backend
 */

/*
import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Item types for drag and drop
const ItemTypes = {
  CARD: 'card'
};

// Interface for the draggable item
interface CardItem {
  id: number;
  text: string;
  index: number;
}

// Draggable card component
const Card: React.FC<{
  id: number;
  text: string;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
}> = ({ id, text, index, moveCard }) => {
  // Set up drag functionality
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Set up drop functionality
  const [, drop] = useDrop({
    accept: ItemTypes.CARD,
    hover: (item: CardItem) => {
      if (item.index !== index) {
        moveCard(item.index, index);
        item.index = index;
      }
    },
  });

  // Apply the drag and drop refs
  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: '#f0f0f0',
        padding: '1rem',
        marginBottom: '0.5rem',
        borderRadius: '0.25rem',
        cursor: 'move',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      }}
    >
      {text}
    </div>
  );
};

// Container for the cards
const DragDropExample: React.FC = () => {
  // Initial state with a few cards
  const [cards, setCards] = useState([
    { id: 1, text: 'Card 1' },
    { id: 2, text: 'Card 2' },
    { id: 3, text: 'Card 3' },
    { id: 4, text: 'Card 4' },
  ]);

  // Function to move a card from one position to another
  const moveCard = (dragIndex: number, hoverIndex: number) => {
    const dragCard = cards[dragIndex];
    const newCards = [...cards];
    newCards.splice(dragIndex, 1);
    newCards.splice(hoverIndex, 0, dragCard);
    setCards(newCards);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <h2>Drag and Drop Example</h2>
        <p>Drag the cards to reorder them</p>
        <div style={{ width: '300px', margin: '0 auto' }}>
          {cards.map((card, index) => (
            <Card
              key={card.id}
              id={card.id}
              text={card.text}
              index={index}
              moveCard={moveCard}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

export default DragDropExample;
*/
