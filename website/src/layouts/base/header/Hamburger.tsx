const styledHamburger = `
    .hamburger {
        width: 2rem;
        height: 2rem;
        display: flex;
        justify-content: space-around;
        flex-flow: column nowrap;
        z-index: 1001;
    }
    
    .burger {                     
        width: 2rem;
        height: 0.25rem;
        border-radius: 10px;
        transform-origin: 1px;
        transition: all 0.3s linear;
    }
    
    .burger1--open {
        transform: rotate(45deg);
    }
    
    .burger1--closed {
        transform: rotate(0);
    }
    
    .burger2--open {
      opacity: 0;
    }
    
    .burger2--closed {
      opacity: 1;
    }
      
    .burger3--open {
      transform: rotate(-45deg);
    }
    
    .burger3--closed {
      transform: rotate(0);
    }
`;

type HamburgerProps = {
    isOpen: boolean;
};

function Hamburger({ isOpen }: HamburgerProps) {
    return (
        <div className='relative mr-4' aria-label='main menu'>
            <div className='hamburger'>
                <div className={`burger bg-black burger1--${isOpen ? 'open' : 'closed'}`} />
                <div className={`burger bg-black burger2--${isOpen ? 'open' : 'closed'}`} />
                <div className={`burger bg-black burger3--${isOpen ? 'open' : 'closed'}`} />
            </div>
            <style>{styledHamburger}</style>
        </div>
    );
}

export { Hamburger };
