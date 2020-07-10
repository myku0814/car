/**
 * 只用於快速建立HTMLElement。知道怎麼用就好，不一定要看懂內部程式。
 * @param  {String}       tag_name   tag名稱，如div、span等。
 * @param  {String|Array} class_list css-class清單
 * @param  {String}       inner_html innerHTML
 * @param  {JsonObject}   attrs      用於setAttribute的key-value物件。
 * @return {HTMLElement}
 */
function simpleCreateHTML(tag_name, class_list, inner_html, attrs){
    const check = t => t !== void 0 && t !== null;

    const node = document.createElement(tag_name);
    if ( check(class_list) ){
        class_list = Array.isArray(class_list) ? class_list : [class_list];
        node.classList.add(...class_list);
    }
    if ( check(inner_html) ){
        node.innerHTML = inner_html;
    }
    if ( check(attrs) ){
        Object.keys(attrs).forEach(k => node.setAttribute(k, attrs[k]));
    }
    return node;
}

/**
 * class是物件導向的基礎，不知道做什麼用的可以去查。
 * constructor()是javascript內，class的「建構子」。
 * 一般來說，class的第一個字會是大寫。
 */

class Car {
    constructor(name){
        this.name = name;
        this.speed = 1;
        this.position = 0;
    }
}

let user = {
    'age': 20,
    'stdheartrate':120
};

class Controller {
    constructor(){
        this.currentDevice = null;

        this.cars = [];

        this.nodes = {
            'cars': null
        };

        this.status = {
            carMoveTimer: null,
            carMovePass: false,
            carMoveInterval: 1000,
            trackLength: 1800,

            max: -200,
            maxindex: 0,
            runningPeakindex:0,
            indexThreshold:200,
            waveThreshold:1,
            sampleRate:500,
            heartrate:0
        };
    }
    /**
     * 這個系統的控制器(Controller)初始化用的函數。「初始化」就是所有主要程式要跑之前，一定要先做的某些事情。
     * @param  {HTMLElement} main_node 要鑲入這個系統的介面節點。
     * @return {undefined}
     */
    init(main_node){
        main_node.classList.add('main--');
        
        const button_scope = simpleCreateHTML('div', 'buttons');
        main_node.appendChild(button_scope);

        const button_chars = ['start', 'connect', 'settings', 'device', 'test'];
        for(let i=0; i<button_chars.length; i++){
        let button = simpleCreateHTML('span', 'button', button_chars[i], {'data-buttonword': button_chars[i]});
        button.addEventListener("click", button_listener); //加入事件監聽，按按鈕執行button_listener
        button_scope.appendChild(button);
        }
        const cars_scope = simpleCreateHTML('div', 'cars');
        main_node.appendChild(cars_scope);
        this.nodes['cars'] = cars_scope;

        const controller = this;
        function button_listener(e){
            let button_word = this.getAttribute('data-buttonword');
            switch(button_word){
                case 'start':
                    controller.startCarTimer();
                    this.parentNode.querySelector('.button[data-buttonword="start"]').innerHTML = 'quit';
                    this.parentNode.querySelector('.button[data-buttonword="start"]').setAttribute('data-buttonword', 'quit');
                    break;

                case 'quit':
                    controller.stopCarTimer();
                    this.parentNode.querySelector('.button[data-buttonword="quit"]').innerHTML = 'start';
                    this.parentNode.querySelector('.button[data-buttonword="quit"]').setAttribute('data-buttonword', 'start');
                    break;
                case 'device':
    
                    getDevice();

                    break;

                case 'connect':

                    this.parentNode.querySelector('.button[data-buttonword="connect"]').innerHTML = 'x';
                    this.parentNode.querySelector('.button[data-buttonword="connect"]').setAttribute('data-buttonword', 'x');
                    controller.currentDevice.gatt.connect()  
                    .then(server => {
                        return server.getPrimaryService('713d0002-503e-4c75-ba94-3148f18d941e');
                    })
                    .then(service => {
                        console.log(service);
                        return service.getCharacteristic('713d0002-503e-4c75-ba94-3148f18d941e');
                    }) 
                    .then(chara => {
                        console.log(chara);
                        let lock = true;
                        chara.startNotifications().then(c => {
                            c.addEventListener('characteristicvaluechanged', function(e){
                                if(lock){
                                    //console.log(this.value.buffer);
                                    //lock = false;
                                    //debugger;
                                    algorithm(Array.from(new Uint8Array(this.value.buffer)));
                                }
                            });
                        })
                    })
                    .catch(error => {console.log(error)});
                    break;

                case 'x':

                    this.parentNode.querySelector('.button[data-buttonword="x"]').innerHTML = 'connect';
                    this.parentNode.querySelector('.button[data-buttonword="x"]').setAttribute('data-buttonword', 'connect');
                    controller.currentDevice.gatt.disconnect();                    
                    break;
                
                case 'settings':

                    user.age = prompt('請輸入年齡', '請填數字');
                    user.stdheartrate = (220 - user.age)*0.6;
                    console.log('年齡已設定為' + user.age + '歲');
                    console.log('標準心率為'+ user.stdheartrate + '(每分鐘)');
                    break;
                case 'test':
                    
                    message = {
                        ex1: "hi",
                        ex2: {a: 1, b: 2}
                    };

                    console.log("<--", message);
                    window.webkit.messageHandlers.bluetooth.postMessage(message);
                    break;
                
                default: 

                    alert('oops...');
                    break;
            } 
        }

        function getDevice() {
            navigator.bluetooth.requestDevice({
                // filters: [{

                //     name: 'Trianswer02'
                // }],
                // optionalServices: ['713d0002-503e-4c75-ba94-3148f18d941e']
                //'713d0002-503e-4c75-ba94-3148f18d941e'
                //acceptAllDevices: true//
                acceptAllDevices:true
            })
            .then(device => {
                console.log(device);
                controller.currentDevice = device;
            });
        }

        function algorithm(byteValues){
            //let max = -200;
            //const lastPeakindex = 0;
            //let maxindex = 0;
            //let runningPeakindex = 0;
            //const indexThreshold = 200;
            //const waveThreshold = 50;
            //let m = [];
            //const sampleRate = 500;
            //let list = [];
            const st = controller.status;

            function HeartRateCalculation(x, x2){
                let heartrate = st.sampleRate * 60/ (x2 - x);
                console.log('heartrate: ' + heartrate);
                return heartrate;
            }

            /*function saveData(data){
                list.push(data);
            }*/
            
            //saveData(byteValues);
            //console.log('algo has');
            //console.log('array buffer' + byteValues.length );
            for (let i=0; i<byteValues.length; i++){
                //console.log('for has');
                if(st.max > byteValues[i]){
                    //console.log('1 has');
                    if((st.max - byteValues[i]) > st.waveThreshold){
                        console.log('2 has');
                        if(st.maxindex > st.indexThreshold){
                            st.heartrate = HeartRateCalculation(0, st.maxindex);
                            st.runningPeakindex = st.runningPeakindex - st.maxindex;
                            st.maxindex = 0;
                        }

                        else st.max = -200;
                    }
                }

                else{
                    //console.log('else has');
                    st.max = byteValues[i];
                    st.maxindex = st.runningPeakindex;
                }

                st.runningPeakindex += 1;
            }
        }
    }
    /**
     * 某台車子獲勝時，會呼叫的函數。
     * @param  {Car}       car 獲勝的那台車。
     * @return {undefined}
     */
    carWin(car){
        // 下面是最簡單的範例。
        alert(car.name + '獲勝。');
    }


    /**
     * 用來建立更新車子資料及介面的計時器。計時器會根據設定的週期，定時自動做某些事情。
     * @return {undefined}
     */
    startCarTimer(){
        const car_nodes = this.nodes['cars'].querySelectorAll('.car-scope');

        // 建立一個定時器，每carMoveInterval毫秒就會讓車子移動一次。
        this.status.carMoveTimer = setInterval(() => {
            // 如果沒有處於pass狀態，讓所有車往前移動。
            if ( !this.status.carMovePass ){
                this.cars.forEach((car, i) => {
                    //車子往前移動。
                    car.position += car.speed;
                    // 如果這輛車到達終點，就認定他獲勝。
                    if ( car.position >= this.status.trackLength ){
                        car.position = this.status.trackLength;
                        this.stopCarTimer();
                        this.carWin(car);
                    }
                    // 更新單台車子的元件介面
                    this.updateCarHTML(car_nodes[i], car);
                });
            }
        }, this.status.carMoveInterval);
    }
    /**
     * 用來清除(中止)讓車子資料更新的定時器的函數。清除後只能用startCarTimer()重啟。
     * @return {undefined}
     */
    stopCarTimer(){
        clearInterval(this.status.carMoveTimer);
        this.status.carMoveTimer = null;
    }
    /**
     * 僅用於建立Car物件，建立介面相關的程式碼則寫在createCarHTML()。
     * @param  {String} name
     * @return {undefined}
     */
    createCar(name){
        //如果name沒有給值，給定一個預設值。
        name = name || '車子' + (this.cars.length + 1).toString();

        const car = new Car(name);
        this.cars.push(car);

        this.nodes['cars'].appendChild(this.createCarHTML(car));
    }

    /**
     * 更新車子元件的內部介面。所有更新車子元件介面的程式都寫在這。
     * @param  {HTMLElement} node 必定是creaetCarHTML()創建出來的
     * @param  {Car}         car  Car物件
     * @return {undefined}
     */
    updateCarHTML(node, car){
        const car_node = node.querySelector('.car');
        
        //更新速度
        if(Math.abs(main_controller.status.heartrate - user.stdheartrate) < 10){
            main_controller.cars[0].speed = main_controller.cars[1].speed;
        }

        else{
            console.log('else');
            main_controller.cars[0].speed = main_controller.cars[1].speed * (1 - Math.abs(main_controller.status.heartrate - user.stdheartrate) / user.stdheartrate);
        }

        // 更新位置
        car_node.style.top = (100 * car.position / this.status.trackLength).toFixed(1) + '%';
    }
    /**
     * 建立一個用於介面的車子元件。
     * @param  {Car}         car Car物件
     * @return {HTMLElement} 
     */
    createCarHTML(car){
        const car_scope = simpleCreateHTML('div', 'car-scope');

        // 顯示名稱用
        car_scope.appendChild(simpleCreateHTML('div', 'car-name', car.name));

        // 跑道
        const track_node = simpleCreateHTML('div', 'car-track');
        // 車子本體
        const car_node = simpleCreateHTML('span', 'car');


        // 這個只是裝飾用的跑道線，無必要性。
        track_node.appendChild(simpleCreateHTML('div', 'track-line'));

        track_node.appendChild(car_node);
        car_scope.appendChild(track_node);

        return car_scope;
    }
}


/**
 * ===========================
 * 測試用
 */



const main_controller = new Controller();
main_controller.init(document.querySelector('#main'));

// 建兩台車當作測試
main_controller.createCar('you');
main_controller.createCar('standard');

main_controller.cars[1].speed = 1;










// 1. function check(t){                  等同    const check = t => t !== void 0 && t !== null;
//        return t != void && t != null;
//    }
// 2. check是一個指標，指向這個函數的參照
// 3. 用箭頭函數主要是this指向哪裡的問題，所以才不寫成function check()的形式
// 4. function check(){
//    return 1;
//     }
//    check = "blalba"
// 5. 因為不是const，所以你可以讓他指向別的東西，而原本的那個無名函數因為沒有人指向他了，JS會自動清
// 6. 不過像你也可以，              雖然check被改成字串，但因為還有a指向這個無名函數
//    function check(){
//    }
//    const a = check;
//    check = "blalba";
// 7. object.key(xxx) 將xxx的屬性列成陣列顯示
// 8. 意思是forEach是一個用來遍歷陣列的函數, 他forEach()裡面是可以寫一個函數，讓陣列裡的元素都做那個動作
// 9. classList.add(xxx) 在CSS加一個xxx名字的class
// 10. .後面是接該物件的成員變數，不是屬性
// 11. ...為展開運算子，參數不能是陣列，把他內容拿出來用
// 12. class Person {
//         constructor(n){
//             this.name = n;
//         }
//     }
//     const a = new Person('小明');
//     console.log(a.name); // 小明
// 13. 人有名字，所以在建構子裡寫一個this.name，代表這個人的名字、然後人會走路，於是你可以在這class Person裡寫一個walk()函數
// 14. this是指向被new出來的Controller本身     
// 15. this.nodes.cars和this.nodes['cars']是一樣的，sting寫法好處是可以使用不合法字元(一般只能英文數字底線)
// 16. this.nodes['cars']只是一個指標吧，指向cars_scope，之後函數會用到
// 17. 塞在nodes裡只是方便管理，假如有五六個HTML node，都集中放在裡面管理
// 18. 監聽函數寫在創建按鈕那才合理。
// 19. 事件觸發時，this會指向characteristic
// 20. 比方說，按鈕的click觸發時，this會指向按鈕本身
// 21. htmlelement的自訂attribute，一定要用data-開頭且不要用底線，這是w3c的標準，不符合標準某些瀏覽器會報錯有些不會，後面一樣可以用-號，看個人自由（？
// 22. 外面先讓controller儲存this後，alo裡要用controller.status.xxx存取你設的全域變數
// 23. 是function()裡的function()的裡面，this有很高機率指向不一樣的東西，但箭頭函數就很安全，這是箭頭函數的特性。
// 24. 對了，所以一般來說，函數內部的話，event的callback我習慣都寫成function(e){...}，其他函數則盡量用箭頭。
// 25. slice只是複製一個陣列而已，防止傳進函數後，陣列被動到而產生錯誤，複製一個新的再傳進去就沒這個問題。
// 26. 這樣講好了，有個class叫做Element，也就是HTMLElement，他是內建的class。而像我們Car就是自訂的class。
// 27. 一般來說我們Car物件來稱呼被new出來的Car，在你呼叫document.createElement()的時候，他就會回傳一個Element物件。
// 28. 再來解釋一下名詞，先看到Car裡的constructor，像this.name = 'xxx'，name就稱為Car的成員變數，而如果我在Car裡寫一個run()函數，run就被稱為Car的成員函數
// 29. 像init()就是Controller的成員函數，carWin()之類的也都是，而querySelector是Element的成員函數，所以只要Element物件都能呼叫他，document.createElement()回傳的都是Element物件
// 30. 而如果像你在index.html裡寫<div></div>，其實底層就是document.createElement('div')，只是瀏覽器偷偷做了你不知道。
// 31. 然後html裡是有父子結構的，像    bb是aa的子節點，aa是bb的父節點
//     <div id="aa">
//         <span id="bb"></span>
//     </div>
// 32. 節點的英文node，和Element物件是同樣的說法，id只是Element的成員變數
// 33. parentNode就只是取得他的父節點而已，因為querySelector只會搜尋所有子節點，但那些button都是同一層，沒有父子關係，所有得先跳到父節點才能搜尋。
// 34. div#aa
//         div#bb
//             div#cc
//     我這邊直接用簡寫，div#aa是css選擇器的語法，意思是一個id叫aa的div，cc是bb的子節點，bb是aa的子節點。
// 35. div#aa                b1的querySelector只能搜尋到cc，aa則可以b1 b2 cc b2c1 b2c2。
//         div#b1
//             div#cc
//         div#b2
//             div#b2c1
//             div#b2c2
// 36. then也是同個概念，你傳進一個callback，這個callback在resolve()時才會被系統呼叫
// 37. 是成員函數就要加.呼叫