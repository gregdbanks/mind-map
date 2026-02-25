import { render, screen, fireEvent } from '@testing-library/react';
import { RatingWidget } from '../RatingWidget';

describe('RatingWidget', () => {
  const defaultProps = {
    currentRating: 4.2,
    ratingCount: 15,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders 5 star buttons', () => {
    render(<RatingWidget {...defaultProps} />);
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5);
  });

  it('renders star buttons with correct aria-labels', () => {
    render(<RatingWidget {...defaultProps} />);
    expect(screen.getByLabelText('Rate 1 star')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate 2 stars')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate 3 stars')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate 4 stars')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate 5 stars')).toBeInTheDocument();
  });

  it('displays formatted rating and count text', () => {
    render(<RatingWidget {...defaultProps} />);
    expect(screen.getByText('4.2 (15)')).toBeInTheDocument();
  });

  it('displays em dash and zero count when rating is 0', () => {
    render(<RatingWidget currentRating={0} ratingCount={0} />);
    // \u2014 is the em dash character
    expect(screen.getByText('\u2014 (0)')).toBeInTheDocument();
  });

  it('displays rating with one decimal place', () => {
    render(<RatingWidget currentRating={3} ratingCount={7} />);
    expect(screen.getByText('3.0 (7)')).toBeInTheDocument();
  });

  it('calls onRate with the star number when a star is clicked', () => {
    const onRate = jest.fn();
    render(<RatingWidget {...defaultProps} onRate={onRate} />);

    fireEvent.click(screen.getByLabelText('Rate 3 stars'));
    expect(onRate).toHaveBeenCalledWith(3);
    expect(onRate).toHaveBeenCalledTimes(1);
  });

  it('calls onRate for each distinct star click', () => {
    const onRate = jest.fn();
    render(<RatingWidget {...defaultProps} onRate={onRate} />);

    fireEvent.click(screen.getByLabelText('Rate 1 star'));
    fireEvent.click(screen.getByLabelText('Rate 5 stars'));

    expect(onRate).toHaveBeenCalledTimes(2);
    expect(onRate).toHaveBeenNthCalledWith(1, 1);
    expect(onRate).toHaveBeenNthCalledWith(2, 5);
  });

  it('does not call onRate when disabled', () => {
    const onRate = jest.fn();
    render(<RatingWidget {...defaultProps} onRate={onRate} disabled />);

    fireEvent.click(screen.getByLabelText('Rate 3 stars'));
    expect(onRate).not.toHaveBeenCalled();
  });

  it('sets buttons as disabled when disabled prop is true', () => {
    render(<RatingWidget {...defaultProps} disabled />);
    const stars = screen.getAllByRole('button');
    stars.forEach((star) => {
      expect(star).toBeDisabled();
    });
  });

  it('buttons are not disabled by default', () => {
    render(<RatingWidget {...defaultProps} />);
    const stars = screen.getAllByRole('button');
    stars.forEach((star) => {
      expect(star).not.toBeDisabled();
    });
  });

  it('fills stars up to the currentRating value', () => {
    // currentRating=4.2 -> displayRating falls back to currentRating (no hover, no userRating)
    // Stars 1-4 should be filled, star 5 should not
    const { container } = render(<RatingWidget currentRating={4} ratingCount={10} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(5);

    // Stars 1-4 should have fill="#f59e0b"
    for (let i = 0; i < 4; i++) {
      expect(svgs[i]).toHaveAttribute('fill', '#f59e0b');
    }
    // Star 5 should have fill="none"
    expect(svgs[4]).toHaveAttribute('fill', 'none');
  });

  it('fills stars based on userRating when provided', () => {
    const { container } = render(
      <RatingWidget currentRating={2} ratingCount={10} userRating={5} />
    );
    const svgs = container.querySelectorAll('svg');

    // userRating=5 means all 5 stars should be filled
    for (let i = 0; i < 5; i++) {
      expect(svgs[i]).toHaveAttribute('fill', '#f59e0b');
    }
  });

  it('updates visual state on hover', () => {
    const { container } = render(
      <RatingWidget currentRating={1} ratingCount={5} />
    );

    const buttons = screen.getAllByRole('button');
    const svgs = container.querySelectorAll('svg');

    // Before hover: only star 1 filled (currentRating=1)
    expect(svgs[0]).toHaveAttribute('fill', '#f59e0b');
    expect(svgs[1]).toHaveAttribute('fill', 'none');

    // Hover over star 4
    fireEvent.mouseEnter(buttons[3]);

    // After hover: stars 1-4 should be filled
    const svgsAfterHover = container.querySelectorAll('svg');
    for (let i = 0; i < 4; i++) {
      expect(svgsAfterHover[i]).toHaveAttribute('fill', '#f59e0b');
    }
    expect(svgsAfterHover[4]).toHaveAttribute('fill', 'none');
  });

  it('resets visual state on mouse leave', () => {
    const { container } = render(
      <RatingWidget currentRating={2} ratingCount={5} />
    );

    const buttons = screen.getAllByRole('button');

    // Hover star 5
    fireEvent.mouseEnter(buttons[4]);
    // All 5 should be filled
    let svgs = container.querySelectorAll('svg');
    for (let i = 0; i < 5; i++) {
      expect(svgs[i]).toHaveAttribute('fill', '#f59e0b');
    }

    // Leave
    fireEvent.mouseLeave(buttons[4]);
    // Back to currentRating=2: only stars 1-2 filled
    svgs = container.querySelectorAll('svg');
    expect(svgs[0]).toHaveAttribute('fill', '#f59e0b');
    expect(svgs[1]).toHaveAttribute('fill', '#f59e0b');
    expect(svgs[2]).toHaveAttribute('fill', 'none');
  });

  it('does not update hover state when disabled', () => {
    const { container } = render(
      <RatingWidget currentRating={1} ratingCount={5} disabled />
    );

    const buttons = screen.getAllByRole('button');

    // Hover star 5 while disabled
    fireEvent.mouseEnter(buttons[4]);

    // Should still only show 1 star filled (hover should be ignored)
    const svgs = container.querySelectorAll('svg');
    expect(svgs[0]).toHaveAttribute('fill', '#f59e0b');
    expect(svgs[1]).toHaveAttribute('fill', 'none');
  });

  it('renders with custom size prop', () => {
    const { container } = render(
      <RatingWidget {...defaultProps} size={24} />
    );
    const svgs = container.querySelectorAll('svg');
    // Lucide Star with size=24 should have width and height of 24
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('width', '24');
      expect(svg).toHaveAttribute('height', '24');
    });
  });

  it('renders with default size of 18', () => {
    const { container } = render(<RatingWidget {...defaultProps} />);
    const svgs = container.querySelectorAll('svg');
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('width', '18');
      expect(svg).toHaveAttribute('height', '18');
    });
  });
});
