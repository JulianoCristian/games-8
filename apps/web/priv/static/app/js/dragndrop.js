
function DragScope(scope) {

    var currentDragTarget = null

    var isIE = window.navigator.msPointerEnabled

    function calcShift()
    {
        var svgWidth = $svg[0].viewBox.baseVal.width;
        var svgHeight = $svg[0].viewBox.baseVal.height;

        sizeX = svgWidth / innerWidth;
        sizeY = svgHeight / innerHeight;
        size = Math.max(sizeX, sizeY) || 1;

    }

    $(window).on("resize", calcShift);
    $(window).on("orientationchange", calcShift);

    function Draggable(root, options)
    {
        options = options || {},
        this.$el = $(root),
        this.revert = options.revert,
        this.elements = {}, 
        this.proxies = [ "onDown", "onMove", "onUp" ], this.__super__.constructor.call(this), 
        this.enable();
    }

    Draggable.revert = function(){
        if(currentDragTarget){
            currentDragTarget.drop()
        }
    }

    var sizeX,
        sizeY,
        size,
        moved;
        $svg = $("svg");

    calcShift();

    $.inherit(Draggable, scope.Controller);

    $.extend(Draggable.prototype, {

        storeTrf: function() {
            var trf = this.$el.attr("transform");
            this.initTrf = trf ? trf.slice(10, -1).split(/\s+/) : [ 0, 0 ];
        },

        disable: function() {
            this.$el.off(document.createTouch ? "touchstart" : "mousedown", this.onDown),
            this.$el.css({cursor: "default"});
        },

        enable: function() {
            this.$el.on(document.createTouch ? "touchstart" : "mousedown", this.onDown),
            this.$el.attr("style", "cursor: -moz-grab; cursor: -webkit-grab; cursor: grab;");
        },

        onDown: function(e, silent) {
            e.preventDefault(), moved || (moved = !1, this.$el.attr("style", "cursor: -moz-grabbing; cursor: -webkit-grabbing; cursor: grabbing;"), 
            this.$el[0].parentNode.appendChild(this.$el[0]), this.x = this.clientX(e), this.y = this.clientY(e), 
            this.trf = this.$el.attr("transform"), this.trf && (this.trf = this.trf.slice(10, -1).split(/\s+/)), 
            this.storeTrf(), silent || (document.createTouch || isIE ? (this.$el.on("touchmove", this.onMove), 
            this.$el.on("touchend", this.onUp)) : ($("body").on("mousemove", this.onMove), $("body").on("mouseup", this.onUp)), 
            this.$el.trigger("dragstart", {detail: {target:this}})));
        },

        onMove: function(e, silent) {
            e.preventDefault()
            moved = !0
            currentDragTarget = this
            this.dx = ((this.curX = this.clientX(e)) - this.x) * size, 
            this.dy = ((this.curY = this.clientY(e)) - this.y) * size
            this.trf && (this.dx += 0 | this.trf[0], 
            this.dy += 0 | this.trf[1])
            this.$el.attr("transform", "translate(" + this.dx + " " + this.dy + ")") 
            silent || this.$el.trigger("dragmove", {
                detail: {
                    x: this.curX,
                    y: this.curY,
                    event: e
                }
            });
        },

        onUp: function(e, silent) {
            e.preventDefault()
            this.drop(e, silent)
        },

        drop: function(e, silent){
            currentDragTarget = null
            this.$el.attr('style', 'cursor: -moz-grab; cursor: -webkit-grab; cursor: grab;')

            // detect drop
            if(moved){
                var dropList = scope.Droppable.list, 
                    dropTargets =[],
                    intersection,
                    droped
                for(var i = 0, l = dropList.length, item; i < l; i++){
                    item = dropList[i]
                    if((intersection = item.intersect(this.$el)).res){
                        dropTargets.push({
                            square: intersection.square,
                            item: item
                        })
                    }
                }

                dropTargets = dropTargets.sort(function(a,b){ 
                    return (a.square < b.square) - (b.square < a.square) 
                })
                if(dropTargets.length){
                    droped = dropTargets[0].item.drop(this, this.curX, this.curY)
                }

                // revert
                if(!droped){
                    this.$el.transform({
                        from: [this.dx, this.dy].join(' '),
                        to: this.initTrf.join(' ')
                    })
                    if(!silent){
                        this.$el.trigger('revert')
                    }
                }
                if(!silent){
                    this.$el.trigger('dragstop', {detail: {x: this.curX, y: this.curY, event: e}})
                }
                moved = false
            }

            if(document.createTouch || isIE){
                this.$el.off('touchmove', this.onMove)
                this.$el.off('touchend', this.onUp)
            }
            else {
                $('body').off('mousemove', this.onMove)
                $('body').off('mouseup', this.onUp)
            }
        }
    });

    scope.Draggable = Draggable;

    $.mixin({ draggable: function() { return this.each(function(el) { new Draggable(el); }); } });

}

function DropScope(scope) {

    function Droppable(root, options)
    {
        options = options || {},
        this.$el = $(root),
        this.accept = options.accept || function() { return !0; },
        this.onDrop = options.drop || function() {};
        this.elements = {};
        this.proxies = [];
        this.__super__.constructor.call(this);
        this.activate();
    }

    Droppable.list = [];

    $.inherit(Droppable, scope.Controller), $.extend(Droppable.prototype, {
        drop: function(target, x, y) { return this.accept(target, x, y) ? (this.onDrop(target, x, y), !0) : !1; },
        activate: function() { Droppable.list.push(this); },
        release: function() { var i; ~(i = Droppable.list.indexOf(this)) && Droppable.list.splice(i, 1); }
    });

    scope.Droppable = Droppable, 

    $.mixin({
        droppable: function(options) { return this.each(function(el) { new Droppable(el, options); }); }
    });

}
