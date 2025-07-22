## How to Play

This is a 3D variant of the classic game Go. Instead of a flat board, stones are placed on a three-dimensional tetrahedral lattice structure. My friend Henry Segerman showed me this idea many years ago - a tetrahedral lattice makes for a more similar topology to a 2d board than say a 3d grid because the inner nodes have four adjacent nodes, however you will definitely soon notice some differences.

## Capturing Groups

Groups are captured by filling in all their **liberties** (empty spaces adjacent to the group). When a group has no liberties remaining, it is captured and removed from the board.

## Win Conditions

Capture 1 or capture 3 stones is a simpler win condition where you only need to capture a certain number of stones to win. Territory win condition is just like classic go where you get a point for each stone and a point for each territory.

## Progression

You can set up your own custom game or you can play in challenge mode. In challenge mode beat each level to unlock the next one. The AI becomes smarter and the board size increases as you progress.

## Credits

I vibe coded this game with claude code, you can find the code at https://github.com/lukas/go-game
