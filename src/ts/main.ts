interface Level{
    data: Array<Point>,
    scoreIncrement: number,
}
let levels: Array<Level> = [
    {
        data: [],
        scoreIncrement: 1,
    },
    {
        data: [],
        scoreIncrement: 2,
    },
    {
        data: [],
        scoreIncrement: 3,
    },
    {
        data: [],
        scoreIncrement: 4,
    },
    {
        data: [],
        scoreIncrement: 5,
    }
]

enum Direction {
    Up = "UP",
    Down = "DOWN",
    Left = "LEFT",
    Right = "RIGHT",
}

enum PowerupType {
    Shorter,
    Longer,
    Faster,
    Slower,
    MorePoints,
    Ghost
}

interface Powerup{
    type: PowerupType,
    position: Point,
    color: string,
}
interface ActivePowerup{
    type: PowerupType,
    value: number,
}
interface Point{
    x: number,
    y: number
}
class SnakeGame {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D ;
    height: number;
    width: number;
    snakeSize: number;
    score: number;
    snake: Array<Point>;
    x: number;
    y: number;
    food: Point;
    movex: number;
    movey: number;
    direction: Direction;
    level: Level;
    interval: any;
    settings: any;
    scores: Array<number>;
    scoreElem: HTMLElement;
    levelElem: HTMLElement;
    scoresElem: HTMLElement;
    overlayElem: HTMLElement;
    button: HTMLElement;
    containerElem: HTMLElement;
    sidebarElem: HTMLElement;
    inputs: any;
    levels: Array<Level>;
    powerup: Powerup;
    foodEaten: number;
    activePowerup: ActivePowerup;
    head: Point;
    canPowerup: boolean;
    constructor(levels: Array<Level>){
        this.canvas = <HTMLCanvasElement>document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.snakeSize = 10; 
        this.width = this.canvas.width / this.snakeSize;
        this.height= this.canvas.height / this.snakeSize;
        this.ctx.scale(this.snakeSize, this.snakeSize);
        this.ctx.save();

        this.scores = [];
        this.levelElem = document.getElementById('level');
        this.scoreElem = document.getElementById('score');
        this.scoresElem = document.getElementById('wyniki');
        this.overlayElem = document.getElementById('canvasOverlay');
        this.containerElem = document.getElementById('canvasContainer');
        this.sidebarElem = document.getElementById('sidebar');
        this.inputs = {
            labirynt: <HTMLSelectElement> document.getElementById('labirynt'),
            czas: <HTMLInputElement> document.getElementById('czas'),
            jednostka: <HTMLInputElement> document.getElementById('jednostka'),
            predkosc:  <HTMLInputElement> document.getElementById('predkosc')
        };
        this.levels = levels;
        this.button = document.getElementById('startGame');
        this.button.addEventListener('click', this.start);
    }

    draw = () => {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.moveHead();

        //check if not collision
        if( this.checkCollision() ){
            this.gameOver();
            return;
        }
        //check if eaten powerup - if so then set activePowerup and destroy powerup
        if(this.powerup && this.head.x == this.powerup.position.x && this.head.y == this.powerup.position.y){
            let value;
            switch(this.powerup.type){
                case PowerupType.Longer:
                case PowerupType.MorePoints:
                case PowerupType.Shorter:
                    value = this.settings.jednostka;
                    break;

                case PowerupType.Faster:
                case PowerupType.Ghost:
                case PowerupType.Slower:
                    value = this.settings.czas;
                    break;
            }

            this.activePowerup = {
                type: this.powerup.type,
                value
            }
            this.powerup = null;
        }
        
        this.controlSnake();

        // create powerup in certain circumstances
        if(this.canPowerup && this.foodEaten && this.foodEaten % 4 == 0 && this.activePowerup == null && this.powerup == null){
            this.createPowerup();
            this.canPowerup = false;
        }

        if(this.powerup)
            this.paintCell(this.powerup.position.x, this.powerup.position.y, "green", "arc");
        this.paintCell(this.food.x, this.food.y, "red", 'arc');
        this.drawSnake();
    }

    controlSnake = () => {
        if(this.activePowerup){
            switch(this.activePowerup.type){
                case PowerupType.Shorter:
                    while(this.activePowerup.value && this.snake.length){
                        this.snake.pop();
                        this.activePowerup.value-- ;
                    }
                    break;
                case PowerupType.Longer:
                    if(this.head.x == this.food.x && this.head.y == this.food.y){	
                        this.handleEatenFood();
                        this.activePowerup.value++;
                    }   
                    this.activePowerup.value--;
                    break;
            }

            if(this.activePowerup.value == 0)
                this.activePowerup = null;
        }
        else{
            if(this.head.x == this.food.x && this.head.y == this.food.y){	
                this.handleEatenFood();
            }
            else this.snake.pop();
        }

        this.checkSides();
        this.snake.unshift({ ...this.head});
    }
    handleEatenFood = () => {
        this.score += this.level.scoreIncrement;
        this.foodEaten++;
        this.scoreElem.textContent = `score: ${this.score}`;
        this.createFood();
        this.canPowerup = true;
    }
    checkSides = () => {
        if( (this.head.x > this.width - 1) || ( this.head.x < 0 ))
            this.head.x =  (this.head.x > 0)?0:this.width;
        else if( ( this.head.y  > this.height - 1 )|| ( this.head.y < 0))
            this.head.y= (this.head.y > 0)?0:this.height; 
    }
	paintCell = (x: number, y: number, color: string, type: string) => {
        this.ctx.fillStyle = color;
        switch(type){
            case 'arc':
                this.ctx.beginPath();
                this.ctx.arc(x + 0.5, y + 0.5, 0.5, 0, 2 * Math.PI);
                this.ctx.fill();
                break;

            case 'rect':
                this.ctx.fillRect(x, y, 1, 1);
                break;
        }

	}
    createSnake = (length: number = 2, initialX: number = 10, initialY: number = 10) => {
		for(let i = length; i>0; i--){
			this.snake.push(
                {
                 x: (i+initialX),
                 y: initialY
                }
            );
        }
        this.head = {
            x: this.snake[0].x,
            y: this.snake[0].y
        };
	}

    handleClicks = (e: KeyboardEvent) => {
        let keyCode = e.keyCode;
        switch (keyCode) {
            case 37:
                if (this.direction != Direction.Right) {
                    this.direction = Direction.Left;
                }
                break;

            case 39:
                if (this.direction != Direction.Left) {
                    this.direction = Direction.Right;
                }
                break;

            case 38:
                if (this.direction != Direction.Down) {
                    this.direction = Direction.Up;
                }
                break;

            case 40:
                if (this.direction != Direction.Up) {
                    this.direction = Direction.Down;
                }
                break;
            }
    }
	createFood = () => {
		this.food = {
			x: Math.round(Math.random()*(this.width - 1)), 
			y: Math.round(Math.random()*(this.height - 1)), 
		};
    }

    getRandomInt = (min: number, max: number) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }
    createPowerup = () => {
        const enums = [PowerupType.Shorter, PowerupType.Longer, PowerupType.Faster, PowerupType.Slower, PowerupType.MorePoints, PowerupType.Ghost];
        
        const randomIndex = this.getRandomInt(0, enums.length);
        this.powerup = {
            type: <PowerupType> randomIndex,
            position: {
			    x: Math.round(Math.random()*(this.width - 1)), 
                y: Math.round(Math.random()*(this.height - 1))
            },
            color: 'green'
		};
    }
    
    drawSnake = () => {
        for(let i = 0; i < this.snake.length; i++)
		{
            const c = this.snake[i];
            if(i == 0)
                this.paintCell(c.x, c.y, 'blue', 'arc');
            else    
			    this.paintCell(c.x, c.y, "blue", 'rect');
		}
    }
    moveHead = () => {
        switch(this.direction){
            case Direction.Right:
                this.head.x++;
                break;
            case Direction.Left:
                this.head.x--;
                break;
            case Direction.Up:
                this.head.y--;
                break;
            case Direction.Down:
                this.head.y++;
                break;
        }
    }
    checkCollision = () => {
		for(const point of this.snake){
			if(point.x == this.head.x && point.y == this.head.y)
			 return true;
        }
        for(const point of this.level.data){
            if(point.x == this.head.x && point.y == this.head.y)
            return true;
        }
		return false;
    }
    
    gameOver = () => {
        window.clearInterval(this.interval);
        this.interval = null;

        this.updateScores();
        this.toggleClasses();
        this.overlayElem.textContent = `Przegrałeś. Twój wynik: ${this.score}`;

        window.removeEventListener('keydown', this.handleClicks);
        this.button.addEventListener('click', this.start);
    }
    toggleClasses = () => {
        this.overlayElem.classList.toggle('active');
        this.containerElem.classList.toggle('active');
        this.sidebarElem.classList.toggle('active');
    }
    updateScores = () => {
        let i= this.scores.length;
        if(i){
            for(let x=0; x<5; x++){
                if(x < i  &&  this.score == this.scores[x])
                    break;
                if(x >= i || this.score > this.scores[x]){
                    this.scores.splice(x, 0, this.score);
                    let el = document.createElement('LI'),
                    text = document.createTextNode('' + this.score);
                    el.appendChild(text);


                    if(x >= i)
                        this.scoresElem.appendChild(el);
                    else
                        this.scoresElem.insertBefore(el, this.scoresElem.childNodes[x]);
                    break;
                }
            }
            if(this.scores.length > 5){
                this.scores.pop();
                this.scoresElem.removeChild(this.scoresElem.lastChild);
            }
        }
        else{ 
            this.scores.push(this.score);
            this.scoresElem.removeChild(this.scoresElem.lastChild);
            let el = document.createElement('LI'),
                text = document.createTextNode('' + this.score);
            el.appendChild(text);
            this.scoresElem.appendChild(el);
        }
    }

    start = () => {
        this.settings = {
            labirynt: parseInt(this.inputs.labirynt.value),
            czas: parseInt(this.inputs.czas.value),
            jednostka: parseInt(this.inputs.jednostka.value),
            predkosc: parseInt(this.inputs.predkosc.value)
        };

        this.button.removeEventListener('click', this.start);
        window.addEventListener('keydown', this.handleClicks);


        this.level = this.levels[this.settings.labirynt - 1];
        this.levelElem.textContent = `level: ${this.settings.labirynt}`;
        this.scoreElem.textContent = `score: 0`;

        this.score = 0;
        this.activePowerup = null;
        this.powerup = null;
        this.snake = [];
        this.foodEaten = 0;
        this.canPowerup = false;
        // default direction of snake
        this.direction = Direction.Right;
        this.createSnake();
        this.createFood();
        this.toggleClasses();

        if(!this.interval)
            this.interval = setInterval(this.draw, this.settings.predkosc);
    }

}

let game = new SnakeGame(levels);