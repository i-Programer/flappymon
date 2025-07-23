import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        this.load.image('bg_sky', '/assets/bg.jpg');

        this.load.image('skill-dash', '/assets/skills_icon/dash.png');
        this.load.image('skill-floating', '/assets/skills_icon/floating.png');
        this.load.image('skill-dissapear', '/assets/skills_icon/dissapear.png');
        this.load.image('skill-gap_manipulation', '/assets/skills_icon/gap_manipulation.png');
        this.load.image('skill-pipe_destroyer', '/assets/skills_icon/pipe_destroyer.png');

        this.load.image('common', '/assets/flappymons_sprite/0.png');
        this.load.image('rare', '/assets/flappymons_sprite/1.png');
        this.load.image('epic', '/assets/flappymons_sprite/2.png');
        this.load.image('legendary', '/assets/flappymons_sprite/3.png');

    }

    create ()
    {
        this.scene.start('GameScene');
    }
}
