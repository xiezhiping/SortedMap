/* tslint:disable max-file-line-count */
import ElementTypeEnum from '../../../utils/event/conf/ElementTypeEnum'

const DEFAULT = 'default'

/**
 * 一种数据结构对象,有序的map,实现思路,用Map装key和value,用array装key来决定排序的顺序,同时提供foreach等方法
 * 用_sort中的key存放排序type(默认'default'情况下返回按照添加顺序排序)
 * 通过获取Array中存储的真实key值读取Map key中对应的value
 */
export default class SortedMap<T> {
  /**
   * 排序类型：
   * -------'default':按照插入顺序
   * -------'area':按照面积，面积大的在前面
   * -------'length':按照长度，短的在前面
   */
    private _map: Map<string, T>
    private _sort: Map<string, Array<string>>
    private _fun: Map<string, Function>
    constructor() {
        this.init()
    }
    private init() {
        this._map = new Map()
        this._sort = new Map() // key为特定的排序顺序，默认'default'
        this._fun = new Map() // key存放类型，Function存放对应的排序函数
        this._fun.set(DEFAULT, () => null)
        this._sort.set(DEFAULT, [])
    }
  /**
   * @return 返回数据的长度
   */
    get size(): number {
        return this._map.size
    }
    public getSize(type: string): number {
        return this._sort.get(type).length
    }
  /**
   * @return 返回数据的长度
   */
    get length(): number {
        return this._map.size
    }

  /**
   * 往该数据对象实例中set一个键值对
   * @param key: stirng
   * @param value: any
   * @param types: Array<ElementTypeEnum | string> 类型
   * @return SortedMap 返回实例自身
   */
    public set(key: string, value: any, types: Array<ElementTypeEnum | string> = []): SortedMap<T> {// 修改：xzp
        // set会重排序
        let len = this._map.size
        this._map.set(key, value)
        // set后长度没变,但有新值,会影响排序,暂未考虑 TODO
        if (this._map.size > len) {
            this._sort.get(DEFAULT).push(key)
            for (let type of types) {
                let arr = this._sort.get(type as any as string)
                if (!arr) {
                    throw new Error(`您还没为${type}类型绑定Function`)
                }
                this._sort.set(type as any as string,this._binarySort(arr,key,this._fun.get(type as any as string)))

            }
        }
        return this
    }
  /**
   * 根据绑定的涵数,过滤的放到对应的arr中
   * @param key string
   * @param value any
   * @param types Array<string>
   */
    public setByFilter(key: string, value: any, types: Array<string> = []): SortedMap<T> {
        let len = this._map.size
        this._map.set(key, value)
        // set后长度没变,但有新值,会影响排序,暂未考虑 TODO
        if (this._map.size > len) {
            this._sort.get(DEFAULT).push(key)
            for (let type of types) {
                let arr = this._sort.get(type)
                if (!arr) {
                    throw new Error(`您还没为${type}类型绑定Function`)
                }
                let fun = this._fun.get(type)
                fun(value, key) && arr.push(key)
            }
        }
        return this
    }

  /**
   * 往该数据对象实例中push一个键值对
   * @param key: string
   * @param vaue: any
   * @return number push数据的长度
   */
    public push(key: string, value: any, types: Array<string> = []) {
        this.set(key, value, types)
    }

  /**
   * 从数据对象的头部插入一个新的键值对
   * @param key: string
   * @param value: any
   * @return number unshift数据的长度
   * @description 默认插入'default'
   */
    public unshift(key: string, value: any, types: Array<string> = []): number {
        // #TODO这个还要根据应用场景完善-xzp
        let len = this._map.size
        this._map.set(key, value)
        if (this._map.size > len) {
            this._sort.get(DEFAULT).unshift(key)
            for (let type of types) {
                let arr = this._sort.get(type)
                if (!arr) {
                    throw new Error(`您还没为${type}类型绑定Function`)
                }
                // TODO 此处可以进行优化,因为原数据是有序的,可以用二分插入
                arr.push(key)
                this._sort.set(type, this._quicksort(arr, this._fun.get(type)))
            }
        }
        return this.size
    }

  /**
   * 从数据对象头部"弹"出一个数据
   * @return any 返回value,不返回键
   */
    public shift(type: string = DEFAULT): any {
        if (this.length > 0) {
            let key0 = this._sort.get(type)[0]
            let res = this._map.get(key0)
            this.delete(key0) // 以上注释的逻辑统一在delete中实现，删除一个key，要删除对应的type下的值
            return res
        }
        return undefined
    }

  /**
   * 通过key值获取对应的value
   * @param key string
   * @return any 返回value
   */
    public get(key: string): any {
        return this._map.get(key)
    }
  /**
   *
   * @param type 排序类型
   */
    public getFun(type: string | ElementTypeEnum): Function {
        return this._fun.get(type as any as string)
    }
  /**
   * 返回该sortedMap的所有排序type
   */
    public getTypes(): Array<ElementTypeEnum | string> {
        let arr: Array<ElementTypeEnum | string > = []
        for (let key of this._sort.keys()) {
            arr.push(key)
        }
        return arr
    }
  /**
   * 会在设置Function 时同时初始化_sort的默认数组
   * @param type 排序类型
   * @param fun  排序规则函数
   */
    public setFun(type: string | ElementTypeEnum, fun: Function) {
        this._fun.set(type as any as string, fun)
        this._sort.set(type as any as string, [])
    }
  /**
   * 从type类型的数据对象的尾部"弹"出对应一个value,如数据对象无值,则返回undefined
   * @return any 返回value
   */
    public pop(type: string = DEFAULT): any {
        if (this.length > 0) {
            let key = this._sort.get(type)[this.length - 1]
            let res = this.get(key)
            this.delete(key)
            return res
        }
        return undefined
    }

  /**
   * 判断数据对象是否拥有某个key
   * @param key string
   * @return boolean
   */
    public has(key: string, type: string = DEFAULT): boolean {
        return type === DEFAULT ? this._map.has(key)
      : this._sort.get(type).indexOf(key) !== -1
    }

  /**
   * 从数据对象中删除key及对应（type中所有）的数据,暂时不提供根据type删除,因为没想到应用场景
   * @param key string
   * @return boolean 返回删除是否成功
   */
    public delete(key: string): boolean {
        let deleteRes = this._map.delete(key)
        if (deleteRes) {
            for (let type of this._sort.keys()) {
                let index = this._sort.get(type).indexOf(key)
                index !== -1 && this._sort.get(type).splice(index, 1)
            }
        }
        return deleteRes
    }

  /**
   * 根据下标从数据对象中删除index对应的key及value  默认是非排序的值
   * @param index type类型下对应的下标
   * @return boolean 返回删除是否成功
   */
    public remove(index: number, type: string = DEFAULT): boolean {
        let key = this._sort.get(type)[index]
        return this.delete(key)
    }

  /**
   * 将数据对象清空
   * @return void
   */
    public clear(): void {
        this.init()
    }

  /**
   * 将数据组对象根据type进行倒序
   * @return SortedMap 返回数据对象自身
   */
    public reverse(type: string = DEFAULT): SortedMap<T> {
        this._sort.get(type).reverse()
        return this
    }

  /**
   * 根据type获取数据对象的key
   * @return Array<string>
   */
    public keys(type: string = DEFAULT): Array<string> {
        return this._sort.get(type)
    }

  /**
   * 获取数据对象的values
   * @return Array<any>
   */
    public values(type: string = DEFAULT): Array<any> {
        let res = []
        let keys = this._sort.get(type)
        let len = keys.length
        for (let i = 0; i < len; i++) {
            res.push(this.get(keys[i]))
        }
        return res
    }

  /**
   * 可以通过此方法对数据对象进行正序遍历
   * @param cbFun (value, key, obj) => {}, obj是用户传入的参数
   * @param obj ?: Object 用户传入的参数对象,会在cbFun中作为第三个参数传入,可选
   * @return void
   */
    public forEach(cbFun: Function, obj: Object = {}, isBreak: boolean = false, types: Array<string | ElementTypeEnum>= [DEFAULT]): void {
        for (let type of types) {
            let keys = this._sort.get(type as any as string)
            let len = keys.length
            for (let i = 0; i < len; i++) {
                if (cbFun(this.get(keys[i]), keys[i], obj) && isBreak) {
                    break
                }
            }
        }
    }

  /**
   * 可以通过此方法对数据对象进行倒序遍历
   * @param cbFun (value, key, obj) => {}, obj是用户传入的参数
   * @param obj ?: Object 用户传入的参数对象,会在cbFun中作为第三个参数传入,可选
   * @return void
   */
    public forEachReverse(cbFun: Function, obj: Object = {}, isBreak: boolean = false, type: string = DEFAULT): void {
        let keys = this._sort.get(type)
        for (let i = keys.length - 1; i >= 0; i--) {
            if (cbFun(this.get(keys[i]), keys[i], obj) && isBreak) {
                break
            }
        }
    }

  /**
   * 用户可以用此方法对数据对象行过滤,返回过滤后的新对象,此方法不会对原对象造成影响
   * @param dbFun: (value, key):boolean => {}
   * @return SortedMap 返回一个过滤后的新的数据对象
   */
    public filter(cbFun: Function, type: string = DEFAULT): SortedMap<T> {
        let sm: SortedMap<T> = new SortedMap()
        let keys = this._sort.get(type)
        let len = keys.length
        for (let i = 0; i < len; i++) {
            let value = this.get(keys[i])
            cbFun(value, keys[i]) && sm.set(keys[i], value)
        }
        return sm
    }

  /**
   * 根据index获取对应的value
   * @param index number
   * @return any 返回value
   */
    public at(index: number, type: string = DEFAULT): any {
        return this.get(this._sort.get(type)[index])
    }

  /**
   * 获取某key在当前数据对象中的索引
   * @param key map的键
   * @return number 如没有该key,则返回-1
   */
    public indexOf(key: string, type: string = DEFAULT): number {
        return this._sort.get(type).indexOf(key)
    }

  /**
   * 获取当前key在类型type的后一个元素的key
   * @param key 传入的元素的key
   * @return 此key的后一个key,如不存在,则返回 ''
   */
    public afterKey(key: string, type: string = DEFAULT): string {
        let index = this.indexOf(key, type)
        let keys = this._sort.get(type)
        if (index !== -1 && index < keys.length - 1) {
            return keys[index + 1]
        }
        return ''
    }

  /**
   * 获取当前key的前一个元素的key
   * @param key
   */
    public beforeKey(key: string, type: string = DEFAULT): string {
        let index = this.indexOf(key)
        return index > 0 ? this._sort.get(type)[index - 1] : ''
    }

  /**
   * 根据key获取此key之后的T对象
   * @param key string map 的 key
   * @return T
   */
    public after(key: string, type: string = DEFAULT): T {
        let afterKey = this.afterKey(key, type)
        return afterKey === '' ? null : this.get(afterKey)
    }

  /**
   * 根据key获取此key之前的T对象
   * @param key string map 的 key
   * @return T
   */
    public before(key: string, type: string = DEFAULT): T {
        let beforeKey = this.beforeKey(key, type)
        return beforeKey === '' ? null : this.get(beforeKey)
    }

  /**
   * 根据索引对数据对象元素位置进行交换  默认只针对default情况
   * @param fromIndex number 第一个要交换的元素下标
   * @param toIndex number 第二个要交换的元素下标
   * @return SortedMap 返回交换后的数据对角自身
   */
    public indexSwop(fromIndex: number, toIndex: number, type: string = DEFAULT): SortedMap<T> {
        let keys = this._sort.get(type)
        keys[toIndex] = this._sort.get(type).splice(fromIndex, 1, keys[toIndex])[0]
        return this
    }

  /**
   * 关注的是数据，可以直接从map中来，默认default
   * 将某个下标的数据移动到另一个下标的数据之后
   * @param fromIndex number 要移动的元素的下标
   * @param toIndex number 要移动到哪一个元素的下标
   */
    public indexMove(fromIndex: number, toIndex: number, type: string = DEFAULT): SortedMap<T> {
        let keys = this._sort.get(type)
        if (
      fromIndex !== toIndex &&
      fromIndex >= 0 &&
      fromIndex < keys.length &&
      toIndex >= 0 &&
      toIndex < keys.length
    ) {
            let item = keys[fromIndex]
            keys.splice(fromIndex, 1)
            keys.splice(toIndex, 0, item)
        }
        return this
    }

  /**
   * 将某下标的元素移动到数据对象的最后
   * @param index number 要移动的元素的下标
   * @return SortedMap 返回移动后的数据对象自身
   */
    public index2Last(index: number, type: string = DEFAULT): SortedMap<T> {
        let toIndex = type === DEFAULT ? this.size - 1 : this._sort.get(type).length - 1
        return this.indexMove(index, toIndex, type)
    }

  /**
   * 将某下标的元素移动到数据对象的头部
   * @param index number 要移动的数据对象的下标
   * @return SortedMap 返回移动后的数据对象自身
   */
    public index2First(index: number, type: string = DEFAULT): SortedMap<T> {
        return this.indexMove(index, 0, type)
    }

  /**
   * 将某下标的元素向后移动step步长的位置,如果超出范围,则移动到最后一位
   * @param index number 要移动的元素的下标
   * @param step number 移动的步长,默认值1,可选
   * @return SortedMap 返回移动后的数据对象
   */
    public index2Back(index: number, step: number = 1, type: string = DEFAULT): SortedMap<T> {
        let keys = this._sort.get(type)
        let toIndex = index < keys.length - step ? index + step : keys.length - 1
        return this.indexMove(index, toIndex, type)
    }

  /**
   * 将某下标的元素向前移动step步长,如超出范围,则移动到最前
   * @param index number 要移动的元素的下标
   * @param step 移动的步长,默认为1,可选
   * @return SortedMap 返回移动后的数据象
   */
    public index2Front(index: number, step: number = 1, type: string = DEFAULT): SortedMap<T> {
        let toIndex = index - step > 0 ? index - step : 0
        return this.indexMove(index, toIndex, type)
    }

  /**
   * 将key对应的元素移动到数据对象的尾部
   * @param key string
   * @return SortedMap 返回移动后的数据对象
   */
    public key2Last(key: string, type: string = DEFAULT): SortedMap<T> {
        let index = this._sort.get(type).indexOf(key)
        return index !== -1 ? this.index2Last(index, type) : this
    }

  /**
   * 将key对应的元素移动到数据对象的头部
   * @param key string
   * @return SortedMap 返回移动后的数据对象
   */
    public key2First(key: string, type: string = DEFAULT): SortedMap<T> {
        let index = this._sort.get(type).indexOf(key)
        return index !== -1 ? this.index2First(index, type) : this
    }

  /**
   * 根据key将其对应的元素向后移动step步长,如超出范围,则移动至最后
   * @param key string 元素的key
   * @param step number 步长,默认值1
   * @return SortedMap 返回移动后的数据对象
   */
    public key2Back(key: string, step: number = 1, type: string = DEFAULT): SortedMap<T> {
        let index = this._sort.get(type).indexOf(key)
        return index !== -1 ? this.index2Back(index, step, type) : this
    }

  /**
   * 根据key将其对应的元素前移动step步长,如超出范围,则移动至最前
   * @param key string 元素的key
   * @param step number 步长,默认值1
   * @return SortedMap 返回移动后的数据对象
   */
    public key2Front(key: string, step: number = 1, type: string = DEFAULT): SortedMap<T> {
        let index = this._sort.get(type).indexOf(key)
        return index !== -1 ? this.index2Front(index, step, type) : this
    }

  /**
   * 根据某个排序方法对数据对象进行排序
   * @param sortFun (elA: any, elB: any): boolean => { return elA.x > elB.y } 元素A,B是指保存在Map中的value
   * @param fun Function 这是一个用于临时排序规则的函数
   * @return SortedMap 返回排序后的数据对象自身
   */
    public sort(type: string | ElementTypeEnum, fun ?: Function): SortedMap<T> {
        !fun && (fun = this._fun.get(type as any as string))
        if (!fun) {
            throw new Error('no sort function,setFun first')
        }
        return this.sortByFun(type as any as string, fun)
    }

    private sortByFun(type: string, sortFun: Function): SortedMap<T> {
        let a = this._quicksort(this._sort.get(type), sortFun)
        this._sort.set(type, a)
        return this
    }
  /**
   * 有序数组插入时的二分插入排序算法
   * @param arr 待排序数组
   * @param key 插入元素key
   * @param sortFun 排序函数
   */
    private _binarySort(arr: Array<string>, key, sortFun): Array<string> {
        let length = arr.length
        let newArr = []
        let low = 0
        let high = length - 1
        let mid
        while (low <= high) {
            mid = (low + high) >> 1
            sortFun(this.get(key), this.get(arr[mid])) ? high = mid - 1 : low = mid + 1
        }
        for (let i = 0; i <= length; i++) {
            if (low === i) {
                newArr[i] = key
            } else if (i > low) {
                newArr[i] = arr[i - 1]
            } else {
                newArr[i] = arr[i]
            }
        }
        return newArr
    }
  /**
   * 快排的私有方法
   * @param arr 要排序的数组
   * @param sortFun 排序的规则方法
   */
    private _quicksort(arr, sortFun): Array<string> {
        if (arr.length <= 1) {
            return arr
        }
        let mid = Math.floor((arr.length - 1) / 2)
        // 注意这里返回数组中间值的同时，又把中间值拿出去
        let midval = arr.splice(mid, 1)[0]
        let left = []
        let right = []
        for (let i = 0; i < arr.length; i++) {
            sortFun(this.get(arr[i]), this.get(midval))
        ? left.push(arr[i])
        : right.push(arr[i])
        }
        return this._quicksort(left, sortFun).concat(
      midval,
      this._quicksort(right, sortFun)
    )
    }

  /**
   * 将此数据对象进行序列化
   */
    public serialization(): string {
    // #TODO
        return ''
    }

  /**
   * 将此数据对象反序列化
   * @param str string
   */
    public static deserialization<T>(str: string): SortedMap<T> {
    // #TODO
        let st: SortedMap<T> = new SortedMap()
        return st
    }
}
