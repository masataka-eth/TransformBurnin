// SPDX-License-Identifier: MIT

/*
 * Created by masataka.eth (@masataka_net)
 */

import "./interface/ITokenURI.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

pragma solidity >=0.7.0 <0.9.0;

contract TokenURI is ITokenURI,AccessControl{
    using Strings for uint256;

    struct WalletMng {
        uint128 burninIndex;
        uint128 burninCount;
    }

    IERC721 public burninNFT;

    address public constant WITHDRAW_ADDRESS = 0x6A1Ebf8f64aA793b4113E9D76864ea2264A5d482;
    
    mapping(uint256 => uint256) public _burninIndexTokenId;
    mapping(address => WalletMng) public _walletMng;

    uint128 public _currentBurninIndex = 1; // First time burnin is 1 and original is 0.
    bool public paused = true;
    uint256 public cost = 0.001 ether;
    bytes32 public merkleRoot;
    string public baseURI;
    string public URIExtension;
    string public beforeRevealURI;

    event Registory(uint256 indexed burningIndex, address indexed owner, uint256 tokenId);

    error OnlyOperatedByTokenOwner(uint256 tokenId, address operator);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    // modifier
    modifier onlyAdmin() {
        _checkRole(DEFAULT_ADMIN_ROLE);
        _;
    }
    // onlyAdmin
    function setBurninNFT(IERC721 _address) external onlyAdmin {
        burninNFT = _address;
    }
    function setCost(uint256 _value) external onlyAdmin {
        cost = _value;
    }
    function setMerkleRoot(bytes32 _merkleRoot) external onlyAdmin {
        merkleRoot = _merkleRoot;
    }
    function setBaseURI(string memory newURI) external virtual onlyAdmin {
        baseURI = newURI;
    }
    function setURIExtension(string memory newExt) external virtual onlyAdmin {
        URIExtension = newExt;
    }
    function setBeforeRevealURI(string memory newURI) external virtual onlyAdmin {
        beforeRevealURI = newURI;
    }
    function IncBurninIndex() external onlyAdmin {
        _currentBurninIndex += 1;
    }
    function setPaused(bool _value) external onlyAdmin {
        paused = _value;
    }
    function withdraw() external onlyAdmin {
        (bool os, ) = payable(WITHDRAW_ADDRESS).call{value: address(this).balance}("");
        require(os);
    }


    // external
    function burninRegistory
    (uint256[] memory _burnTokenIds,uint256 _alAmountMax,bytes32[] calldata _merkleProof) 
        external payable{
        require(paused == false,"sale is not active");
        require(tx.origin == msg.sender,"the caller is another controler");
        require(getALAuth(msg.sender,_alAmountMax,_merkleProof) == true,"You don't have a Allowlist!");
        require(_burnTokenIds.length > 0, "need to burnin at least 1 NFT");
        require(_burnTokenIds.length <= _getRemainWithCheck(msg.sender,_alAmountMax), "claim is over max amount");
        require(msg.value >= cost * _burnTokenIds.length, "not enough eth");
        
        _walletMng[msg.sender].burninCount += uint128(_burnTokenIds.length);

        for (uint256 i = 0; i < _burnTokenIds.length; i++) {
            uint256 tokenId = _burnTokenIds[i];
            if(burninNFT.ownerOf(tokenId) != msg.sender) revert OnlyOperatedByTokenOwner(tokenId, msg.sender);
            _burninIndexTokenId[tokenId] = _currentBurninIndex;
            emit Registory(_currentBurninIndex,msg.sender,tokenId);
        }
    }

    function getALAuth(address _address,uint256 _wlAmountMax,bytes32[] calldata _merkleProof)
    public view returns (bool) {
        bool _exit = false;
        bytes32 _leaf = keccak256(abi.encodePacked(_address,_wlAmountMax));   

        if(MerkleProof.verifyCalldata(_merkleProof, merkleRoot, _leaf) == true){
            _exit = true;
        }

        return _exit;
    }

    function _resetCount(address _owner) internal{
        if(_walletMng[_owner].burninIndex < _currentBurninIndex){
            _walletMng[_owner].burninIndex = _currentBurninIndex;
             _walletMng[_owner].burninCount = 0;
        }
    }

    function _getRemain(address _address,uint256 _alAmountMax) internal  view returns  (uint256){
        uint256 _Amount = 0;
        if(_walletMng[_address].burninIndex < _currentBurninIndex){
            _Amount = _alAmountMax;
        }else{
            _Amount = _alAmountMax - _walletMng[_address].burninCount;
        }
        return _Amount;
    }

    function _getRemainWithCheck(address _address,uint256 _alAmountMax) internal returns (uint256){
        _resetCount(msg.sender);  // Always check reset
        return _getRemain(_address,_alAmountMax);
    }

    function getRemain(address _address,uint256 _alAmountMax,bytes32[] calldata _merkleProof
    ) external view returns (uint256) {
        uint256 _Amount = 0;
        if(paused == false){
            if(getALAuth(_address,_alAmountMax,_merkleProof) == true){
                _Amount = _getRemain(_address,_alAmountMax);
            }
        }
        return _Amount;
    }

    function tokenURI_future(uint256 _tokkenId) external view
    returns(string memory URI){

        if(_burninIndexTokenId[_tokkenId] < _currentBurninIndex){
            // Show Image
            URI = string.concat(
                baseURI,
                _burninIndexTokenId[_tokkenId].toString(),
                "/",
                _tokkenId.toString(),
                URIExtension
            );
        }else{
            // before rebeal
            URI = beforeRevealURI;
        }
        
    }
    
    // function tokenURI_future(uint256,bool) external pure
    // returns(string memory){
    //     return "tokenURLcall";
    // } 
}